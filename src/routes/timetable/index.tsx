import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { styled } from '@mui/material/styles'
import { Box } from '@mui/material'
import MuiTimetable from './-MuiTimetable'
import type { RouterOutput } from '@/integrations/trpc'
import { TIMETABLE_ID } from '@/integrations/trpc'
import { trpcClient as t } from '@/integrations/reactQueryRootProvider'
import { NavBar } from '@/components/Navbar'

export const Route = createFileRoute('/timetable/')({
  component: TimetableCombined,
})

const Main = styled('main', {
  shouldForwardProp: (prop) => prop !== 'drawerState',
})<{
  drawerState?: boolean
  drawerwidth: number
}>(({ theme, drawerState, drawerwidth }) => ({
  flexGrow: 1,
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.easeInOut,
    duration: theme.transitions.duration.leavingScreen,
  }),
  // marginRight: drawerwidth,
  ...(drawerState && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeInOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginRight: drawerwidth,
  }),
  /**
   * This is necessary to enable the selection of content. In the DOM, the stacking order is determined
   * by the order of appearance. Following this rule, elements appearing later in the markup will overlay
   * those that appear earlier. Since the Drawer comes after the Main content, this adjustment ensures
   * proper interaction with the underlying content.
   */
  position: 'relative',
}))

export default function TimetableCombined() {
  const [drawerState, setDrawerState] = useState(false)
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(
    null,
  )
  const [timetable, setTimetable] = useState<RouterOutput['timetable'] | null>(
    null,
  )

  const drawerwidth = 300

  const handleDrawerOpen = () => {
    setDrawerState(true)
  }

  const handleDrawerClose = () => {
    setDrawerState(false)
  }

  useEffect(() => {
    t.timetable
      .query({ subdivsionIds: [4, 5, 6], timetableId: TIMETABLE_ID })
      .then((data) => {
        setTimetable(data)
        console.log(data)
      })
  }, [])

  return (
    <Box sx={{ display: 'flex' }}>
      <NavBar />
      <Main
        drawerState={drawerState}
        drawerwidth={drawerwidth}
        className="main"
      >
        <MuiTimetable
          timetableData={timetable}
          handleDrawerOpen={handleDrawerOpen}
          setSelectedSlotIndex={setSelectedSlotIndex}
        />
      </Main>
    </Box>
  )
}
