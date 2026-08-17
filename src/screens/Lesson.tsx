import { useEffect, useMemo, useRef, useState } from "react";
import { AppBar } from "../components/AppBar";
import { Instruments } from "../components/Instruments";
import { RiveStage } from "../components/RiveStage";
import {
  TOTAL_LESSONS,
  lessons,
  nextStop,
  slotNumber,
} from "../data/curriculum";
import { useBottomSheet } from "../lib/useBottomSheet";
import { useProgress } from "../lib/progress";
import { useInstruments } from "../lib/useInstruments";
import type { Rive } from "@rive-app/react-webgl";
import type { Lesson as LessonModel, LessonAction } from "../data/curriculum";

interface Props {
  lesson: LessonModel;
  onBack: () => void;
  onGoto: (lessonId: string) => void;
  onReview: (chapter: number) => void;
  onFinish: () => void;
}

/** Watch what to touch → do the task → read why it happened. */
type Step = "watch" | "do" | "learn";

/** How long the task step may sit unsolved before the hint offers itself. */
const STUCK_MS = 20_000;

export function LessonScreen({
  lesson,
  onBack,
  onGoto,
  onReview,
  onFinish,
}: Props) {
  const { progress, complete } = useProgress();
  const [rive, setRive] = useState<Rive | null>(null);
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const [step, setStep] = useState<Step>("watch");
  const [showHint, setShowHint] = useState(false);
  // The sheet starts as a slim peek — one instruction and its button — so the
  // artwork owns the screen. Every lesson starts that same way and there are
  // no exceptions: lessons used to be able to open it themselves on arrival,
  // which made those few start unlike all the others.
  const [open, setOpen] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const { sheetRef, scrimRef, dragging, toggle, collapse, dragHandleProps } =
    useBottomSheet(open, setOpen);

  const alreadyDone = !!progress[lesson.id];
  const n = slotNumber(lesson.id);
  const after = useMemo(() => nextStop(lesson.id), [lesson.id]);

  // The bar reports how much of the course is actually finished. It used to
  // report the lesson's *position*, so opening lesson 8 first showed a
  // seven-tenths-full bar to someone who had done nothing.
  const doneCount = lessons.filter((l) => progress[l.id]).length;

  const { values, solved, markSolved } = useInstruments(
    rive,
    lesson,
    alreadyDone,
  );

  // Some artboards already draw their own readout panel on the canvas — for
  // those lessons `readouts` is empty, and there is nothing left to reveal.
  // The learn step never gates its content on `open`, so it stays expandable
  // regardless.
  const hasDetail = lesson.readouts.length > 0;
  const canExpand = hasDetail || step === "learn";

  useEffect(() => {
    if (solved && !alreadyDone) complete(lesson.id);
  }, [solved, alreadyDone, complete, lesson.id]);

  // Clearing the task is the cue to move on — but only when it is cleared
  // *here*, on the task step. Several lessons can be satisfied by following
  // the Find-it instruction (lesson 1's "flip the switch" is the checkpoint),
  // and auto-advancing on a checkpoint that was already met threw the learner
  // straight from Find it to Why it works: the button promising a task
  // delivered the explanation instead, and the task step was never seen.
  const wasSolved = useRef(solved);
  useEffect(() => {
    if (solved && !wasSolved.current && step === "do") setStep("learn");
    wasSolved.current = solved;
  }, [solved, step]);

  // The learn step is nothing but explanation, so the sheet opens itself.
  useEffect(() => {
    if (step === "learn") setOpen(true);
  }, [step]);

  // A learner who sits on the task without progress should not have to admit
  // defeat to get help — after a while the hint surfaces on its own.
  useEffect(() => {
    if (step !== "do" || solved || showHint || !lesson.checkpoint) return;
    const id = window.setTimeout(() => setShowHint(true), STUCK_MS);
    return () => window.clearTimeout(id);
  }, [step, solved, showHint, lesson.checkpoint]);

  // One short burst the first time this lesson is cracked — never on revisit.
  const celebratedRef = useRef(alreadyDone);
  useEffect(() => {
    if (!solved || celebratedRef.current) return;
    celebratedRef.current = true;
    setCelebrate(true);
    const id = window.setTimeout(() => setCelebrate(false), 1400);
    return () => window.clearTimeout(id);
  }, [solved]);

  const runAction = (action: LessonAction) => {
    const input = rive
      ?.stateMachineInputs(lesson.stateMachine)
      ?.find((i) => i.name === action.input);
    if (!input) return;

    if (action.kind === "trigger") {
      input.fire();
    } else {
      const next = !toggles[action.input];
      input.value = next;
      setToggles((prev) => ({ ...prev, [action.input]: next }));
    }
    if (action.completes) markSolved();
  };

  const steps: Step[] = ["watch", "do", "learn"];
  const stepIndex = steps.indexOf(step);

  // Each step starts reading from the top; leftover scroll from the previous
  // step — or from the height the sheet just changed by — would leave the lead
  // sentence hidden above the fold.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [step, open]);

  /** The task step is green only when the task was actually cleared — passing
   *  it with Skip used to paint it done, which is a claim the app cannot make. */
  const stepDone = (s: Step, i: number) =>
    s === "do" ? solved : i < stepIndex;

  const stepName = (s: Step) =>
    s === "watch" ? "Find it" : s === "do" ? "Try it" : "Why it works";

  /* Rendered on Find it as well as Try it. Two lessons open with "Press Spin
     it below" / "Press Release it below", and the buttons they name only ever
     appeared on the next step — so the very first instruction pointed at a
     control that was not on screen. */
  const actionRow = lesson.actions?.length ? (
    <div className="actions">
      {lesson.actions.map((action) => (
        <button
          key={action.input}
          type="button"
          className={`btn ${
            action.tone === "ghost" ? "btn--ghost" : "btn--primary"
          } ${toggles[action.input] ? "is-on" : ""}`.trim()}
          onClick={() => runAction(action)}
          disabled={!rive}
        >
          {action.label}
        </button>
      ))}
    </div>
  ) : null;

  const goNext = () => {
    if (after?.kind === "lesson") onGoto(after.id);
    else if (after?.kind === "review") onReview(after.chapter);
    else onFinish();
  };

  /** What sits on the sheet's bottom rail. Every step has something there —
   *  the way on once there is one, and while the task is still open, the two
   *  ways out of it. Leaving the hint and skip up in the scrolling copy left
   *  them stranded mid-sheet with blank paper underneath, and made the task
   *  step the one step whose sheet ended in nothing. */
  const dock =
    step === "do" && !solved && lesson.checkpoint ? (
      <div className="hintrow">
        {showHint ? (
          <p className="step__hint">{lesson.checkpoint.hint}</p>
        ) : (
          <button
            type="button"
            className="linkish"
            onClick={() => setShowHint(true)}
          >
            Need a hint?
          </button>
        )}
        <button
          type="button"
          className="linkish linkish--quiet"
          onClick={() => setStep("learn")}
        >
          Skip
        </button>
      </div>
    ) : step === "watch" ? (
      <button
        type="button"
        className="btn btn--primary btn--wide"
        onClick={() => setStep("do")}
      >
        Got it — give me a task
      </button>
    ) : step === "do" && solved ? (
      <button
        type="button"
        className="btn btn--primary btn--wide"
        onClick={() => setStep("learn")}
      >
        Why it works
      </button>
    ) : step === "learn" ? (
      <button
        type="button"
        className="btn btn--primary btn--wide"
        onClick={goNext}
      >
        {after?.kind === "review"
          ? "Chapter review"
          : after?.kind === "lesson"
            ? "Next lesson"
            : "Finish the course"}
      </button>
    ) : null;

  return (
    <div className={`screen lesson lesson--${lesson.stage}`}>
      <AppBar
        onBack={onBack}
        subtitle={`Lesson ${n} of ${TOTAL_LESSONS}`}
        title={lesson.title}
        right={
          solved ? <span className="pill pill--done">Done</span> : undefined
        }
        progress={doneCount / lessons.length}
      />

      {/* Full-bleed stage: no card, no inset — the artwork is the backdrop. */}
      <div className="lesson__stage">
        <RiveStage
          key={lesson.id}
          artboard={lesson.artboard}
          stateMachine={lesson.stateMachine}
          stage={lesson.stage}
          bindViewModel={lesson.bindViewModel}
          onReady={setRive}
        />
        {celebrate && (
          <div className="burst" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => (
              <i key={i} />
            ))}
          </div>
        )}
      </div>

      {/* Dims the artwork as the sheet opens — the read that the panel has
          become its own floating layer, not just a taller footer. Tapping
          it is the same "back out" gesture as tapping the handle. */}
      <div
        ref={scrimRef}
        className={`sheet__scrim ${open ? "is-open" : ""}`.trim()}
        onClick={collapse}
        aria-hidden="true"
      />

      <div
        ref={sheetRef}
        className={`sheet ${open ? "is-open" : ""} ${dragging ? "is-dragging" : ""}`.trim()}
      >
        {/* The sheet's only toggle: drag it, or tap it. The chevron rides
            inside it rather than sitting in the step row as a second button
            doing the same job. */}
        {canExpand && (
          <button
            type="button"
            className="sheet__grab"
            onClick={toggle}
            aria-expanded={open}
            aria-label={open ? "Hide details" : "More details"}
            {...dragHandleProps}
          >
            <span className="sheet__handle" aria-hidden="true" />
            <svg
              className="sheet__chev"
              viewBox="0 0 12 12"
              width="12"
              height="12"
              aria-hidden="true"
            >
              <path
                d="M2.5 7.5 L6 4 L9.5 7.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        <nav className="steps" aria-label="Lesson steps">
          {steps.map((s, i) => {
            const current = i === stepIndex;
            return (
              <button
                key={s}
                type="button"
                className={`steps__seg ${current ? "is-current" : ""} ${
                  stepDone(s, i) ? "is-done" : ""
                }`.trim()}
                aria-current={current}
                aria-label={`Step ${i + 1}: ${stepName(s)}`}
                onClick={() => setStep(s)}
              >
                <span className="steps__dot" aria-hidden="true" />
                {current && <span className="steps__name">{stepName(s)}</span>}
              </button>
            );
          })}
        </nav>

        {/* Step and checkpoint changes were silent to a screen reader: the
            readouts are visual, and "Done" only ever appeared as a pill. */}
        <p className="sr-only" role="status">
          {`Step ${stepIndex + 1} of 3: ${stepName(step)}.`}
          {solved ? " Task complete." : ""}
        </p>

        <div className="sheet__scroll" ref={scrollRef}>
          {/* One wrapper so the step's natural height can be measured: a
              scroller never reports content shorter than the box it is in. */}
          <div className="sheet__inner">
            {step === "watch" && (
              <>
                <p className="step__lead">{lesson.watch}</p>
                {actionRow}
                {/* Always in the tree where the lesson has readouts of its own:
                  closed, it peeks below the fold (and is reachable by scroll);
                  open, the extra height reveals it. */}
                {hasDetail && (
                  <div className="sheet__detail">
                    <Instruments readouts={lesson.readouts} values={values} />
                  </div>
                )}
              </>
            )}

            {step === "do" && (
              <>
                <p className="step__lead">
                  {lesson.checkpoint ? lesson.checkpoint.goal : lesson.tagline}
                </p>

                {actionRow}

                {hasDetail && (
                  <div className="sheet__detail">
                    <Instruments readouts={lesson.readouts} values={values} />
                  </div>
                )}

                {/* Arriving here already solved — because the Find-it step asked
                  for the same move, or because the lesson was done before —
                  gets an acknowledgement and a way on, not a task with no
                  ending and two text links where the button should be. The
                  unsolved case's hint and skip live on the bottom rail. */}
                {solved && (
                  <p className="step__win">
                    <span aria-hidden="true">✓</span> Done — that is the move.
                  </p>
                )}
              </>
            )}

            {step === "learn" && (
              <>
                {solved && (
                  <p className="step__win">
                    <span aria-hidden="true">✓</span> Nice — that is the idea.
                  </p>
                )}
                <div className="prose">
                  {lesson.body.map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* The step's one way forward, docked below the scrolling pane rather
            than appended to the end of it. Inside the scroll it fell past the
            fold whenever the copy ran long — the whole explanation step on a
            short phone, and every step in landscape, where the sheet is a
            narrow column and this button was sliced in half by its edge. */}
        {dock && <div className="sheet__dock">{dock}</div>}
      </div>
    </div>
  );
}
