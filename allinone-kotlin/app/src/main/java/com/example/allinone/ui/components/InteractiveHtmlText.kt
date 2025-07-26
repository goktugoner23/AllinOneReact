package com.example.allinone.ui.components

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.text.Html
import android.text.Spanned
import android.text.style.ClickableSpan
import android.text.method.LinkMovementMethod
import android.view.View
import android.widget.TextView
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape

import androidx.compose.material.icons.Icons

import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.withStyle
import androidx.compose.foundation.text.ClickableText
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import java.util.regex.Pattern

// Helper data class for URL matching
private data class UrlMatch(val start: Int, val end: Int, val text: String)

// Helper function to find URLs in text
private fun String.findUrls(): List<UrlMatch> {
    val urlPattern = "(?i)\\b(?:https?://|www\\.)\\S+\\b".toRegex()
    return urlPattern.findAll(this).map { match ->
        UrlMatch(match.range.first, match.range.last + 1, match.value)
    }.toList()
}

/**
 * Advanced HTML text renderer that supports interactive checkboxes and rich formatting
 */
@Composable
fun InteractiveHtmlText(
    html: String,
    modifier: Modifier = Modifier,
    maxLines: Int = Int.MAX_VALUE,
    textColor: Color = MaterialTheme.colorScheme.onSurface
) {
    
    // Parse the HTML content to detect formatting and lists
    val parsedContent = remember(html) {
        parseHtmlContent(html)
    }
    
    // Always use custom renderer for better formatting support
    InteractiveHtmlRenderer(
        content = parsedContent,
        modifier = modifier,
        textColor = textColor,
        maxLines = maxLines
    )
}

/**
 * Simple HTML text renderer using AndroidView for non-interactive content
 */
@Composable
fun SimpleHtmlText(
    html: String,
    modifier: Modifier = Modifier,
    textColor: Color = MaterialTheme.colorScheme.onSurface,
    maxLines: Int = Int.MAX_VALUE
) {
    AndroidView(
        factory = { context ->
            TextView(context).apply {
                setTextColor(textColor.toArgb())
                setMaxLines(maxLines)
                ellipsize = android.text.TextUtils.TruncateAt.END
                movementMethod = LinkMovementMethod.getInstance()
            }
        },
        update = { textView ->
            val spanned = Html.fromHtml(html, Html.FROM_HTML_MODE_COMPACT)
            textView.text = spanned
        },
        modifier = modifier
    )
}

/**
 * Interactive HTML renderer that handles checkboxes and other interactive elements
 */
@Composable
fun InteractiveHtmlRenderer(
    content: ParsedHtmlContent,
    modifier: Modifier = Modifier,
    textColor: Color = MaterialTheme.colorScheme.onSurface,
    maxLines: Int = Int.MAX_VALUE
) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        content.elements.take(maxLines).forEach { element ->
            when (element) {
                is HtmlElement.Text -> {
                    HtmlTextElement(
                        element = element,
                        textColor = textColor
                    )
                }

                is HtmlElement.BulletPoint -> {
                    BulletPointElement(
                        element = element,
                        textColor = textColor
                    )
                }
                is HtmlElement.NumberedItem -> {
                    NumberedItemElement(
                        element = element,
                        textColor = textColor
                    )
                }
            }
        }
    }
}

@Composable
fun HtmlTextElement(
    element: HtmlElement.Text,
    textColor: Color
) {
    val context = LocalContext.current
    
    // Check if text contains links
    val urlPattern = "(?i)\\b(?:https?://|www\\.)\\S+\\b".toRegex()
    val urlMatches = urlPattern.findAll(element.content).toList()
    
    if (urlMatches.isNotEmpty()) {
        val annotatedString = buildAnnotatedString {
            val matches = element.content.findUrls()
            if (matches.isEmpty()) {
                append(element.content)
            } else {
                var lastIndex = 0
                matches.forEach { match ->
                    // Add text before URL
                    if (match.start > lastIndex) {
                        append(element.content.substring(lastIndex, match.start))
                    }
                    
                    // Add clickable URL annotation
                    val url = if (match.text.startsWith("http")) {
                        match.text
                    } else {
                        "https://${match.text}"
                    }
                    
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
                
                // Add remaining text
                if (lastIndex < element.content.length) {
                    append(element.content.substring(lastIndex))
                }
            }
        }

        @Suppress("DEPRECATION")
        ClickableText(
            text = annotatedString,
            style = androidx.compose.ui.text.TextStyle(
                color = textColor,
                fontSize = when (element.size) {
                    HtmlElement.TextSize.H1 -> 24.sp
                    HtmlElement.TextSize.H2 -> 20.sp
                    HtmlElement.TextSize.H3 -> 18.sp
                    HtmlElement.TextSize.NORMAL -> 16.sp
                    HtmlElement.TextSize.SMALL -> 14.sp
                },
                fontWeight = if (element.isBold) FontWeight.Bold else FontWeight.Normal,
                textDecoration = when {
                    element.isUnderline && element.isStrikethrough -> TextDecoration.combine(
                        listOf(TextDecoration.Underline, TextDecoration.LineThrough)
                    )
                    element.isUnderline -> TextDecoration.Underline
                    element.isStrikethrough -> TextDecoration.LineThrough
                    else -> TextDecoration.None
                }
            ),
            onClick = { offset ->
                annotatedString.getStringAnnotations(tag = "URL", start = offset, end = offset)
                    .firstOrNull()?.let { annotation ->
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(annotation.item))
                        context.startActivity(intent)
                    }
            }
        )
    } else {
        // Original text without links
        Text(
            text = element.content,
            color = textColor,
            fontSize = when (element.size) {
                HtmlElement.TextSize.H1 -> 24.sp
                HtmlElement.TextSize.H2 -> 20.sp
                HtmlElement.TextSize.H3 -> 18.sp
                HtmlElement.TextSize.NORMAL -> 16.sp
                HtmlElement.TextSize.SMALL -> 14.sp
            },
            fontWeight = if (element.isBold) FontWeight.Bold else FontWeight.Normal,
            textDecoration = when {
                element.isUnderline && element.isStrikethrough -> TextDecoration.combine(
                    listOf(TextDecoration.Underline, TextDecoration.LineThrough)
                )
                element.isUnderline -> TextDecoration.Underline
                element.isStrikethrough -> TextDecoration.LineThrough
                else -> TextDecoration.None
            }
        )
    }
}



@Composable
fun BulletPointElement(
    element: HtmlElement.BulletPoint,
    textColor: Color
) {
    val context = LocalContext.current
    
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.Top
    ) {
        Text(
            text = "• ",
            color = textColor,
            fontSize = 16.sp
        )
        
        // Check if bullet point text contains links
        val urlMatches = element.text.findUrls()
        
        if (urlMatches.isNotEmpty()) {
            val annotatedString = buildAnnotatedString {
                var lastIndex = 0
                urlMatches.forEach { match ->
                    // Add text before URL
                    if (match.start > lastIndex) {
                        append(element.text.substring(lastIndex, match.start))
                    }
                    
                    // Add clickable URL annotation
                    val url = if (match.text.startsWith("http")) {
                        match.text
                    } else {
                        "https://${match.text}"
                    }
                    
                    pushStringAnnotation(tag = "URL", annotation = url)
                    withStyle(
                        style = SpanStyle(
                            color = Color.Blue,
                            fontSize = 16.sp,
                            textDecoration = TextDecoration.Underline
                        )
                    ) {
                        append(match.text)
                    }
                    pop()
                    
                    lastIndex = match.end
                }
                
                // Add remaining text
                if (lastIndex < element.text.length) {
                    append(element.text.substring(lastIndex))
                }
            }
            
            @Suppress("DEPRECATION")
            ClickableText(
                text = annotatedString,
                style = androidx.compose.ui.text.TextStyle(
                    color = textColor,
                    fontSize = 16.sp
                ),
                modifier = Modifier.weight(1f),
                onClick = { offset ->
                    annotatedString.getStringAnnotations(tag = "URL", start = offset, end = offset)
                        .firstOrNull()?.let { annotation ->
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(annotation.item))
                            context.startActivity(intent)
                        }
                }
            )
        } else {
            Text(
                text = element.text,
                color = textColor,
                fontSize = 16.sp,
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@Composable
fun NumberedItemElement(
    element: HtmlElement.NumberedItem,
    textColor: Color
) {
    val context = LocalContext.current
    
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.Top
    ) {
        Text(
            text = "${element.number}. ",
            color = textColor,
            fontSize = 16.sp,
            fontWeight = FontWeight.Medium
        )
        
        // Check if numbered item text contains links
        val urlMatches = element.text.findUrls()
        
        if (urlMatches.isNotEmpty()) {
            val annotatedString = buildAnnotatedString {
                var lastIndex = 0
                urlMatches.forEach { match ->
                    // Add text before URL
                    if (match.start > lastIndex) {
                        append(element.text.substring(lastIndex, match.start))
                    }
                    
                    // Add clickable URL annotation
                    val url = if (match.text.startsWith("http")) {
                        match.text
                    } else {
                        "https://${match.text}"
                    }
                    
                    pushStringAnnotation(tag = "URL", annotation = url)
                    withStyle(
                        style = SpanStyle(
                            color = Color.Blue,
                            fontSize = 16.sp,
                            textDecoration = TextDecoration.Underline
                        )
                    ) {
                        append(match.text)
                    }
                    pop()
                    
                    lastIndex = match.end
                }
                
                // Add remaining text
                if (lastIndex < element.text.length) {
                    append(element.text.substring(lastIndex))
                }
            }
            
            @Suppress("DEPRECATION")
            ClickableText(
                text = annotatedString,
                style = androidx.compose.ui.text.TextStyle(
                    color = textColor,
                    fontSize = 16.sp
                ),
                modifier = Modifier.weight(1f),
                onClick = { offset ->
                    annotatedString.getStringAnnotations(tag = "URL", start = offset, end = offset)
                        .firstOrNull()?.let { annotation ->
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(annotation.item))
                            context.startActivity(intent)
                        }
                }
            )
        } else {
            Text(
                text = element.text,
                color = textColor,
                fontSize = 16.sp,
                modifier = Modifier.weight(1f)
            )
        }
    }
}

/**
 * Data classes for parsed HTML content
 */
data class ParsedHtmlContent(
    val elements: List<HtmlElement>
)

sealed class HtmlElement {
    data class Text(
        val content: String,
        val isBold: Boolean = false,
        val isItalic: Boolean = false,
        val isUnderline: Boolean = false,
        val isStrikethrough: Boolean = false,
        val size: TextSize = TextSize.NORMAL
    ) : HtmlElement()
    

    
    data class BulletPoint(
        val text: String
    ) : HtmlElement()
    
    data class NumberedItem(
        val number: Int,
        val text: String
    ) : HtmlElement()
    
    enum class TextSize {
        H1, H2, H3, NORMAL, SMALL
    }
}

/**
 * Helper function to decode HTML entities properly (especially for Turkish characters)
 */
private fun decodeHtmlEntities(text: String): String {
    return Html.fromHtml(text, Html.FROM_HTML_MODE_COMPACT).toString()
}

/**
 * Parser for HTML content
 */
fun parseHtmlContent(html: String): ParsedHtmlContent {
    val elements = mutableListOf<HtmlElement>()
    
    // Split content by line breaks and parse each line
    val lines = html.split("<br>", "<br/>", "<br />", "\n")
    var numberedListCounter = 1
    
    for (line in lines) {
        val trimmedLine = line.trim()
        if (trimmedLine.isEmpty()) continue
        
        when {
            // Detect bullet points
            trimmedLine.matches(Regex("^[•·*]\\s+.*")) -> {
                val rawText = trimmedLine.substring(2).trim()
                val decodedText = decodeHtmlEntities(rawText)
                elements.add(HtmlElement.BulletPoint(decodedText))
            }
            
            // Detect numbered lists
            trimmedLine.matches(Regex("^\\d+\\.\\s+.*")) -> {
                val rawText = trimmedLine.substring(trimmedLine.indexOf('.') + 1).trim()
                val decodedText = decodeHtmlEntities(rawText)
                elements.add(HtmlElement.NumberedItem(numberedListCounter++, decodedText))
            }
            
            // Regular text with formatting
            else -> {
                val textElement = parseTextFormatting(trimmedLine)
                elements.add(textElement)
            }
        }
    }
    
    return ParsedHtmlContent(elements)
}

/**
 * Parse text formatting (bold, italic, etc.)
 */
fun parseTextFormatting(text: String): HtmlElement.Text {
    // Use Android's Html.fromHtml to properly decode HTML entities (including Turkish characters)
    val cleanText = decodeHtmlEntities(text).trim()
    
    // Detect formatting from HTML tags
    val isBold = text.contains("<b>") || text.contains("<strong>")
    val isItalic = text.contains("<i>") || text.contains("<em>")
    val isUnderline = text.contains("<u>")
    val isStrikethrough = text.contains("<s>") || text.contains("<strike>")
    
    // Detect heading sizes
    val size = when {
        text.contains("<h1>") -> HtmlElement.TextSize.H1
        text.contains("<h2>") -> HtmlElement.TextSize.H2
        text.contains("<h3>") -> HtmlElement.TextSize.H3
        text.contains("<small>") -> HtmlElement.TextSize.SMALL
        else -> HtmlElement.TextSize.NORMAL
    }
    
    return HtmlElement.Text(
        content = cleanText,
        isBold = isBold,
        isItalic = isItalic,
        isUnderline = isUnderline,
        isStrikethrough = isStrikethrough,
        size = size
    )
}

 