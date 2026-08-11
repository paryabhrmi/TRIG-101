import { useState } from 'react'
import { DesktopGate } from './components/DesktopGate'
import { PhoneFrame } from './components/PhoneFrame'
import { About } from './screens/About'
import { Home } from './screens/Home'
import { LessonScreen } from './screens/Lesson'
import { Review } from './screens/Review'
import { Splash } from './screens/Splash'
import { Upcoming } from './screens/Upcoming'
import { lessonById, upcomingById } from './data/curriculum'
import { useRoute } from './lib/router'
import { useIsDesktop, useViewportHeight } from './lib/useViewport'

function Course() {
  const { route, navigate } = useRoute()

  switch (route.name) {
    case 'home':
      return (
        <Home
          onOpen={(id) => navigate({ name: 'lesson', id })}
          onReview={(chapter) => navigate({ name: 'review', chapter })}
          onAbout={() => navigate({ name: 'about' })}
          onBack={() => navigate({ name: 'splash' })}
        />
      )

    case 'lesson': {
      const lesson = lessonById(route.id)
      if (!lesson) {
        const planned = upcomingById(route.id)
        if (planned) {
          return (
            <Upcoming
              key={planned.id}
              lesson={planned}
              onBack={() => navigate({ name: 'home' })}
            />
          )
        }
        navigate({ name: 'home' }, true)
        return null
      }
      return (
        <LessonScreen
          key={lesson.id}
          lesson={lesson}
          onBack={() => navigate({ name: 'home' })}
          onGoto={(id) => navigate({ name: 'lesson', id })}
          onReview={(chapter) => navigate({ name: 'review', chapter })}
          onFinish={() => navigate({ name: 'home' })}
        />
      )
    }

    case 'review':
      return (
        <Review
          key={route.chapter}
          chapter={route.chapter}
          onBack={() => navigate({ name: 'home' })}
          onGoto={(id) => navigate({ name: 'lesson', id })}
          onFinish={() => navigate({ name: 'home' })}
        />
      )

    case 'about':
      return <About onBack={() => navigate({ name: 'home' })} />

    case 'splash':
      return (
        <Splash
          onStart={() => navigate({ name: 'home' })}
          onResume={(id) => navigate({ name: 'lesson', id })}
        />
      )
  }
}

export default function App() {
  const isDesktop = useIsDesktop()
  const [previewing, setPreviewing] = useState(false)
  useViewportHeight()

  if (isDesktop) {
    return previewing ? (
      <PhoneFrame onClose={() => setPreviewing(false)}>
        <Course />
      </PhoneFrame>
    ) : (
      <DesktopGate onPreview={() => setPreviewing(true)} />
    )
  }

  return <Course />
}
