import { useState } from 'react'
import { DesktopGate } from './components/DesktopGate'
import { PhoneFrame } from './components/PhoneFrame'
import { About } from './screens/About'
import { Home } from './screens/Home'
import { LessonScreen } from './screens/Lesson'
import { Splash } from './screens/Splash'
import { lessonById } from './data/curriculum'
import { useRoute } from './lib/router'
import { useIsDesktop, useViewportHeight } from './lib/useViewport'

function Course() {
  const { route, navigate } = useRoute()

  switch (route.name) {
    case 'home':
      return (
        <Home
          onOpen={(id) => navigate({ name: 'lesson', id })}
          onAbout={() => navigate({ name: 'about' })}
          onBack={() => navigate({ name: 'splash' })}
        />
      )

    case 'lesson': {
      const lesson = lessonById(route.id)
      if (!lesson) {
        navigate({ name: 'home' }, true)
        return null
      }
      return (
        <LessonScreen
          key={lesson.id}
          lesson={lesson}
          onBack={() => navigate({ name: 'home' })}
          onGoto={(id) => navigate({ name: 'lesson', id })}
          onFinish={() => navigate({ name: 'home' })}
        />
      )
    }

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
