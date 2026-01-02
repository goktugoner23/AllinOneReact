// Type declarations for external modules
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.svg';

// Environment variables from react-native-dotenv
declare module '@env' {
  export const FIREBASE_API_KEY: string;
  export const FIREBASE_AUTH_DOMAIN: string;
  export const FIREBASE_PROJECT_ID: string;
  export const FIREBASE_STORAGE_BUCKET: string;
  export const FIREBASE_MESSAGING_SENDER_ID: string;
  export const FIREBASE_APP_ID: string;
  export const API_BASE_URL_DEV: string;
  export const API_BASE_URL_PROD: string;
  export const WS_URL_DEV: string;
  export const WS_URL_PROD: string;
}

declare module 'react-native-pell-rich-editor' {
  import { Component } from 'react';
  import { ViewProps } from 'react-native';

  export interface RichEditorProps extends ViewProps {
    ref?: any;
    html?: string;
    placeholder?: string;
    initialContentHTML?: string;
    initialFocus?: boolean;
    disabled?: boolean;
    enterKeyHint?: string;
    editorInitializedCallback?: () => void;
    editorStyle?: {
      backgroundColor?: string;
      color?: string;
      caretColor?: string;
      placeholderColor?: string;
      contentCSSText?: string;
      cssText?: string;
      initialCSSText?: string;
    };
    onChange?: (text: string) => void;
    onHeightChange?: (height: number) => void;
    onMessage?: (message: any) => void;
    command?: string;
    commandDOM?: string;
    useContainer?: boolean;
    styleWithCSS?: boolean;
    initialHeight?: number;
    pasteAsPlainText?: boolean;
    useCharacter?: boolean;
    defaultHttps?: boolean;
    onPaste?: (text: string) => void;
    onKeyUp?: (event: any) => void;
    onKeyDown?: (event: any) => void;
    onInput?: (text: string) => void;
    onLink?: (url: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    onCursorPosition?: (scrollY: number) => void;
  }

  export interface RichToolbarProps extends ViewProps {
    getEditor: () => RichEditor | null;
    actions?: string[];
    onPressAddImage?: () => void;
    onInsertLink?: () => void;
    disabled?: boolean;
    iconTint?: string;
    unselectedButtonStyle?: any;
    selectedIconTint?: string;
    selectedButtonStyle?: any;
    disabledIconTint?: string;
    disabledButtonStyle?: any;
    iconSize?: number;
    renderAction?: (action: string) => React.ReactElement;
    iconMap?: { [key: string]: any };
  }

  export class RichEditor extends Component<RichEditorProps> {
    setContentHTML(html: string): void;
    insertImage(url: string, style?: string): void;
    insertLink(title: string, url: string): void;
    insertText(text: string): void;
    insertHTML(html: string): void;
    insertVideo(url: string, style?: string): void;
    setContentFocusHandler(handler: Function): void;
    blurContentEditor(): void;
    focusContentEditor(): void;
    registerToolbar(listener: Function): void;
    commandDOM(command: string): void;
  }

  export class RichToolbar extends Component<RichToolbarProps> {}

  export const actions: {
    setBold: string;
    setItalic: string;
    setUnderline: string;
    setStrikethrough: string;
    insertBulletsList: string;
    insertOrderedList: string;
    insertLink: string;
    keyboard: string;
    removeFormat: string;
    insertImage: string;
    insertVideo: string;
    checkboxList: string;
    undo: string;
    redo: string;
  };
}
