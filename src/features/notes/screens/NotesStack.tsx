import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import NotesScreen from './NotesScreen';
import EditNoteScreen from './EditNoteScreen';
import { useColors } from '@shared/theme';

export type NotesStackParamList = {
  NotesList: undefined;
  EditNote: { noteId?: string };
};

const Stack = createStackNavigator<NotesStackParamList>();

export default function NotesStack() {
  const colors = useColors();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="NotesList" component={NotesScreen} />
      <Stack.Screen name="EditNote" component={EditNoteScreen} />
    </Stack.Navigator>
  );
}
