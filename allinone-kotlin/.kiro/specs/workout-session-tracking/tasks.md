# Implementation Plan

- [x] 1. Update workout navigation structure

  - Replace the current workout bottom navigation to have three tabs: Dashboard, Programs, Sessions
  - Remove the Stats tab and Exercises tab
  - Update navigation items and routes
  - _Requirements: 1.1, 6.1, 7.1_

- [x] 2. Implement core data models and repository layer

  - WorkoutSession, SessionExercise, TargetSet, CompletedSet data models are implemented
  - WorkoutSessionRepository interface and implementation completed
  - WorkoutSessionCache for local persistence implemented
  - Error handling with WorkoutSessionError types
  - _Requirements: 5.2, 5.3, 8.1, 8.2_

- [x] 3. Implement StopwatchManager utility

  - Pausable/resumable stopwatch with MM:SS format implemented
  - State persistence across app navigation
  - Background time tracking capability
  - Coroutine-based timer with StateFlow
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 8.3, 8.4_

- [x] 4. Create WorkoutSessionViewModel

  - Complete session lifecycle management implemented
  - Exercise completion tracking with set-by-set progress
  - Integration with StopwatchManager and repository
  - State management with UiState pattern
  - Session persistence and restoration
  - _Requirements: 2.5, 4.1, 4.2, 4.3, 4.4, 5.1, 5.4, 8.1, 8.2, 8.5_

- [x] 5. Build WorkoutSessionScreen UI

  - Main workout session screen with stopwatch at top
  - Exercise list with completion tracking
  - Stop button to finish workout
  - Error handling and loading states
  - Session restoration on screen load
  - _Requirements: 2.1, 3.1, 3.2, 3.3, 5.1_

- [x] 6. Create workout session UI components

  - StopwatchComponent for timer display and controls
  - ExerciseCard for individual exercise tracking
  - WorkoutInfoCard and ProgressOverviewCard
  - All components support the required functionality
  - _Requirements: 2.2, 2.3, 3.4, 4.1, 4.2, 4.3, 4.4_

- [x] 7. Create program selection dialog

  - Build a program selection dialog that appears when "Start Workout" is pressed
  - Display list of available programs with program details
  - Add confirmation flow to start workout with selected program
  - Handle case when no programs are available
  - Integrate with existing WorkoutSessionViewModel.startWorkoutSession()
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 8. Create Sessions tab for workout history

  - Build Sessions tab to display completed workout history
  - Create session cards showing date, duration, program name, completion status
  - Display completed/not completed exercise information
  - Show workouts in chronological order (most recent first)
  - Handle empty state when no workout history exists
  - Use existing repository.getCompletedWorkouts() method
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [ ] 9. Update Dashboard tab with workout statistics

  - The Dashboard tab already exists but needs workout session integration
  - Add "Start Workout" button that shows program selection dialog
  - Display workout session statistics alongside existing workout stats
  - Include session-specific metrics (active sessions, completion rates)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 10. Integrate workout session flow with main navigation

  - Connect "Start Workout" buttons to program selection dialog
  - Ensure proper navigation to WorkoutSessionScreen after program selection
  - Handle navigation back to dashboard after workout completion
  - Update existing workout navigation to support session flow
  - _Requirements: 1.1, 1.2, 5.5_

- [ ] 11. Test and optimize complete workout session flow
  - Test complete flow from program selection to workout completion
  - Verify session persistence across app navigation and backgrounding
  - Ensure proper data synchronization between local cache and Firebase
  - Optimize performance and user experience
  - Handle edge cases and error scenarios
  - _Requirements: All requirements_
