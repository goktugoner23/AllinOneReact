package com.example.allinone.ui.components

import android.graphics.Typeface
import android.text.Html
import android.text.Spannable
import android.text.SpannableString
import android.text.SpannableStringBuilder
import android.text.style.BulletSpan
import android.text.style.ClickableSpan
import android.text.style.ForegroundColorSpan
import android.text.style.StyleSpan
import android.text.style.UnderlineSpan
import android.text.util.Linkify
import android.util.Patterns
import android.view.View
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField

import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.text.selection.TextSelectionColors
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.*
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.*
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.util.regex.Pattern

// Helper data class for URL matching
private data class MatchResult(val start: Int, val end: Int, val text: String)

data class RichTextState(
    val text: String = "",
    val selection: TextRange = TextRange.Zero,
    val formattedText: AnnotatedString = AnnotatedString(""),
    val activeFormats: Set<FormatType> = emptySet()
)

enum class FormatType {
    BOLD, ITALIC, BULLET_LIST, NUMBERED_LIST, URL
}

data class FormatSpan(
    val start: Int,
    val end: Int,
    val type: FormatType
)

// Helper function to convert HTML to AnnotatedString
private fun htmlToAnnotatedString(html: String): AnnotatedString {
    if (html.isEmpty()) return AnnotatedString("")
    
    // Convert HTML to Spanned using Android's Html class
    val spanned = Html.fromHtml(html, Html.FROM_HTML_MODE_COMPACT)
    
    // Convert Spanned to AnnotatedString
    return buildAnnotatedString {
        append(spanned.toString())
        
        // Apply styles based on spans
        val spans = spanned.getSpans(0, spanned.length, Any::class.java)
        for (span in spans) {
            val start = spanned.getSpanStart(span)
            val end = spanned.getSpanEnd(span)
            
            when (span) {
                is StyleSpan -> {
                    when (span.style) {
                        Typeface.BOLD -> {
                            addStyle(SpanStyle(fontWeight = FontWeight.Bold), start, end)
                        }
                        Typeface.ITALIC -> {
                            addStyle(SpanStyle(fontStyle = FontStyle.Italic), start, end)
                        }
                        Typeface.BOLD_ITALIC -> {
                            addStyle(SpanStyle(fontWeight = FontWeight.Bold, fontStyle = FontStyle.Italic), start, end)
                        }
                    }
                }
                is UnderlineSpan -> {
                    addStyle(SpanStyle(textDecoration = TextDecoration.Underline), start, end)
                }
                is ForegroundColorSpan -> {
                    addStyle(SpanStyle(color = Color(span.foregroundColor)), start, end)
                }
            }
        }
    }
}

@Composable
fun RichTextEditor(
    state: RichTextState,
    onStateChange: (RichTextState) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String = "Enter text..."
) {
    // Process HTML content when state changes
    val processedState = remember(state.text) {
        if (state.text.contains("<") && state.text.contains(">")) {
            // Contains HTML tags, convert to AnnotatedString
            val annotatedString = htmlToAnnotatedString(state.text)
            val plainText = annotatedString.text
            state.copy(
                text = plainText,
                formattedText = annotatedString
            )
        } else {
            // Plain text, use as is
            state.copy(formattedText = AnnotatedString(state.text))
        }
    }
    
    Column(modifier = modifier) {
        // Formatting Toolbar
        FormatToolbar(
            activeFormats = processedState.activeFormats,
            onFormatClick = { formatType ->
                val newState = applyFormatting(processedState, formatType)
                onStateChange(newState)
            }
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        // Rich Text Input Field
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                if (processedState.text.isEmpty()) {
                    Text(
                        text = placeholder,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                        modifier = Modifier.align(Alignment.TopStart)
                    )
                }
                
                BasicTextField(
                    value = TextFieldValue(
                        text = processedState.text,
                        selection = processedState.selection
                    ),
                    onValueChange = { textFieldValue ->
                        val newState = processTextChange(processedState, textFieldValue)
                        onStateChange(newState)
                    },
                    modifier = Modifier.fillMaxWidth(),
                    textStyle = MaterialTheme.typography.bodyLarge.copy(
                        color = MaterialTheme.colorScheme.onSurface,
                        lineHeight = 24.sp
                    ),
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Text,
                        autoCorrectEnabled = true
                    ),
                    decorationBox = { innerTextField ->
                        if (processedState.formattedText.text.isNotEmpty()) {
                            Text(
                                text = processedState.formattedText,
                                style = MaterialTheme.typography.bodyLarge.copy(
                                    color = MaterialTheme.colorScheme.onSurface,
                                    lineHeight = 24.sp
                                ),
                                modifier = Modifier.fillMaxWidth()
                            )
                        } else {
                            innerTextField()
                        }
                    },
                    cursorBrush = SolidColor(MaterialTheme.colorScheme.primary)
                )
            }
        }
    }
}

@Composable
private fun FormatToolbar(
    activeFormats: Set<FormatType>,
    onFormatClick: (FormatType) -> Unit,
    modifier: Modifier = Modifier
) {
    val formatButtons = listOf(
        FormatButton(Icons.Default.FormatBold, FormatType.BOLD, "Bold"),
        FormatButton(Icons.Default.FormatItalic, FormatType.ITALIC, "Italic"),
        FormatButton(Icons.AutoMirrored.Filled.FormatListBulleted, FormatType.BULLET_LIST, "Bullet List"),
        FormatButton(Icons.Default.FormatListNumbered, FormatType.NUMBERED_LIST, "Numbered List")
    )
    
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        LazyRow(
            modifier = Modifier.padding(8.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            items(formatButtons) { button ->
                val isActive = activeFormats.contains(button.type)
                
                IconButton(
                    onClick = { onFormatClick(button.type) },
                    modifier = Modifier
                        .size(40.dp)
                        .background(
                            color = if (isActive) MaterialTheme.colorScheme.primary else Color.Transparent,
                            shape = RoundedCornerShape(8.dp)
                        )
                ) {
                    Icon(
                        imageVector = button.icon,
                        contentDescription = button.description,
                        tint = if (isActive) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

private data class FormatButton(
    val icon: ImageVector,
    val type: FormatType,
    val description: String
)

private fun processTextChange(
    currentState: RichTextState,
    newTextFieldValue: TextFieldValue
): RichTextState {
    val newText = newTextFieldValue.text
    val newSelection = newTextFieldValue.selection
    
    // Detect URLs and auto-format them
    val formattedText = buildAnnotatedString {
        val urlPattern = Patterns.WEB_URL
        val matcher = urlPattern.matcher(newText)
        val matches = mutableListOf<MatchResult>()
        
        // Find all URL matches
        while (matcher.find()) {
            matches.add(MatchResult(matcher.start(), matcher.end(), matcher.group()))
        }
        
        if (matches.isEmpty()) {
            append(newText)
        } else {
            var lastIndex = 0
            
            matches.forEach { match ->
                // Add text before URL
                if (match.start > lastIndex) {
                    append(newText.substring(lastIndex, match.start))
                }
                
                // Add clickable URL with LinkAnnotation
                val url = if (match.text.startsWith("http")) match.text else "http://${match.text}"
                pushStringAnnotation(tag = "URL", annotation = url)
                withStyle(
                    style = SpanStyle(
                        color = Color.Blue,
                        textDecoration = TextDecoration.Underline
                    )
                ) {
                    append(match.text)
                }
                pop()
                
                lastIndex = match.end
            }
            
            // Add remaining text after last URL
            if (lastIndex < newText.length) {
                append(newText.substring(lastIndex))
            }
        }
    }
    
    // Determine active formats based on cursor position
    val activeFormats = determineActiveFormats(currentState, newSelection)
    
    return currentState.copy(
        text = newText,
        selection = newSelection,
        formattedText = formattedText,
        activeFormats = activeFormats
    )
}

private fun applyFormatting(
    currentState: RichTextState,
    formatType: FormatType
): RichTextState {
    val selection = currentState.selection
    val text = currentState.text
    
    if (selection.length == 0) {
        // No selection, toggle format for future typing
        val newActiveFormats = if (currentState.activeFormats.contains(formatType)) {
            currentState.activeFormats - formatType
        } else {
            currentState.activeFormats + formatType
        }
        
        return currentState.copy(activeFormats = newActiveFormats)
    }
    
    // Apply formatting to selected text
    val newText = when (formatType) {
        FormatType.BOLD -> {
            wrapWithMarkdown(text, selection, "**")
        }
        FormatType.ITALIC -> {
            wrapWithMarkdown(text, selection, "*")
        }
        FormatType.BULLET_LIST -> {
            applyListFormatting(text, selection, "• ")
        }
        FormatType.NUMBERED_LIST -> {
            applyNumberedListFormatting(text, selection)
        }
        FormatType.URL -> currentState.text // URLs are auto-detected
    }
    
    val newSelection = TextRange(selection.start, selection.start + (newText.length - text.length) + selection.length)
    
    return processTextChange(
        currentState,
        TextFieldValue(newText, newSelection)
    )
}

private fun wrapWithMarkdown(
    text: String,
    selection: TextRange,
    wrapper: String
): String {
    val before = text.substring(0, selection.start)
    val selected = text.substring(selection.start, selection.end)
    val after = text.substring(selection.end)
    
    return "$before$wrapper$selected$wrapper$after"
}

private fun applyListFormatting(
    text: String,
    selection: TextRange,
    prefix: String
): String {
    val selectedText = text.substring(selection.start, selection.end)
    val lines = selectedText.split("\n")
    
    val formattedLines = if (lines.size > 1) {
        // Multi-line: each line becomes a bullet point
        lines.map { line ->
            if (line.trim().isNotEmpty()) {
                "$prefix$line"
            } else {
                line
            }
        }
    } else {
        // Single line: add bullet to the beginning
        listOf("$prefix$selectedText")
    }
    
    val newSelectedText = formattedLines.joinToString("\n")
    
    return text.substring(0, selection.start) + newSelectedText + text.substring(selection.end)
}

private fun applyNumberedListFormatting(
    text: String,
    selection: TextRange
): String {
    val selectedText = text.substring(selection.start, selection.end)
    val lines = selectedText.split("\n")
    
    val formattedLines = if (lines.size > 1) {
        // Multi-line: each line becomes a numbered item
        lines.mapIndexed { index, line ->
            if (line.trim().isNotEmpty()) {
                "${index + 1}. $line"
            } else {
                line
            }
        }
    } else {
        // Single line: add "1. " to the beginning
        listOf("1. $selectedText")
    }
    
    val newSelectedText = formattedLines.joinToString("\n")
    
    return text.substring(0, selection.start) + newSelectedText + text.substring(selection.end)
}

private fun determineActiveFormats(
    currentState: RichTextState,
    @Suppress("UNUSED_PARAMETER") selection: TextRange
): Set<FormatType> {
    // For now, return the current active formats
    // In a more sophisticated implementation, you would analyze the text
    // around the cursor to determine which formats are active
    return currentState.activeFormats
}

@Composable
fun rememberRichTextState(
    initialText: String = "",
    initialSelection: TextRange = TextRange.Zero
): MutableState<RichTextState> {
    return remember {
        mutableStateOf(
            RichTextState(
                text = initialText,
                selection = initialSelection,
                formattedText = AnnotatedString(initialText)
            )
        )
    }
}

@Preview(showBackground = true)
@Composable
private fun RichTextEditorPreview() {
    val state = rememberRichTextState(
        initialText = "This is a sample text with https://example.com and some formatting."
    )
    
    MaterialTheme {
        RichTextEditor(
            state = state.value,
            onStateChange = { state.value = it },
            modifier = Modifier.padding(16.dp),
            placeholder = "Start typing your note..."
        )
    }
} 