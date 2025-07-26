package com.example.allinone.ui.drawing

import android.app.Activity
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas as AndroidCanvas
import android.graphics.Paint as AndroidPaint
import android.graphics.Path as AndroidPath
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Note
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.asAndroidPath
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.core.content.FileProvider
import com.example.allinone.ui.theme.AllInOneTheme
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.*
import kotlin.math.abs

class DrawingActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AllInOneTheme {
                DrawingScreen(
                    onSave = { uri, saveToGallery ->
                        val intent = Intent().apply {
                            putExtra("drawing_uri", uri.toString())
                            putExtra("save_to_gallery", saveToGallery)
                        }
                        setResult(Activity.RESULT_OK, intent)
                        finish()
                    },
                    onCancel = {
                        setResult(Activity.RESULT_CANCELED)
                        finish()
                    }
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DrawingScreen(
    onSave: (Uri, Boolean) -> Unit,
    onCancel: () -> Unit
) {
    val context = LocalContext.current
    
    // Drawing state
    var paths by remember { mutableStateOf(listOf<PathData>()) }
    var currentPath by remember { mutableStateOf(PathData()) }
    var isDrawing by remember { mutableStateOf(false) }
    var canvasSize by remember { mutableStateOf(androidx.compose.ui.geometry.Size.Zero) }
    
    // Drawing settings
    var currentColor by remember { mutableStateOf(Color.Black) }
    var brushSize by remember { mutableStateOf(12f) }
    var showColorPicker by remember { mutableStateOf(false) }
    var showSaveDialog by remember { mutableStateOf(false) }
    
    // Track if there are any changes
    var hasChanges by remember { mutableStateOf(false) }
    
    // Touch tolerance
    val touchTolerance = 4f
    
    // Predefined colors
    val predefinedColors = listOf(
        Color.Black, Color.Red, Color.Green, Color.Blue,
        Color.Yellow, Color.Magenta, Color.Cyan, Color.Gray,
        Color(0xFF8B4513), Color(0xFFFF4500), Color(0xFF32CD32), Color(0xFF4169E1),
        Color(0xFFFF1493), Color(0xFF00CED1), Color(0xFFFF6347), Color(0xFF9ACD32)
    )
    
    // Brush sizes - reduced to 5 options
    val brushSizes = listOf(4f, 8f, 16f, 24f, 32f)

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Drawing") },
                navigationIcon = {
                    IconButton(onClick = onCancel) {
                        Icon(Icons.Default.Close, contentDescription = "Cancel")
                    }
                },
                actions = {
                    // Clear button
                    IconButton(
                        onClick = {
                            paths = emptyList()
                            currentPath = PathData()
                            hasChanges = false
                        },
                        enabled = hasChanges
                    ) {
                        Icon(Icons.Default.Clear, contentDescription = "Clear")
                    }
                    
                    // Save button
                    IconButton(
                        onClick = { showSaveDialog = true },
                        enabled = hasChanges
                    ) {
                        Icon(Icons.Default.Save, contentDescription = "Save")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Drawing canvas
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .padding(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Canvas(
                    modifier = Modifier
                        .fillMaxSize()
                        .pointerInput(Unit) {
                            detectDragGestures(
                                onDragStart = { offset ->
                                    currentPath = PathData(
                                        path = Path().apply { moveTo(offset.x, offset.y) },
                                        color = currentColor,
                                        strokeWidth = brushSize,
                                        lastPoint = offset
                                    )
                                    isDrawing = true
                                    hasChanges = true
                                },
                                onDrag = { _, dragAmount ->
                                    val newPath = currentPath.path
                                    val lastPoint = currentPath.lastPoint
                                    val newPoint = lastPoint + dragAmount
                                    
                                    val dx = abs(newPoint.x - lastPoint.x)
                                    val dy = abs(newPoint.y - lastPoint.y)
                                    
                                    if (dx >= touchTolerance || dy >= touchTolerance) {
                                        newPath.quadraticTo(
                                            lastPoint.x, lastPoint.y,
                                            (newPoint.x + lastPoint.x) / 2, (newPoint.y + lastPoint.y) / 2
                                        )
                                        currentPath = currentPath.copy(
                                            path = newPath,
                                            lastPoint = newPoint
                                        )
                                    }
                                },
                                onDragEnd = {
                                    val finalPath = currentPath.path
                                    finalPath.lineTo(currentPath.lastPoint.x, currentPath.lastPoint.y)
                                    paths = paths + currentPath.copy(path = finalPath)
                                    currentPath = PathData()
                                    isDrawing = false
                                }
                            )
                        }
                ) {
                    // Track canvas size
                    canvasSize = size
                    
                    drawRect(Color.White, size = size)
                    
                    // Draw completed paths
                    paths.forEach { pathData ->
                        drawPath(
                            path = pathData.path,
                            color = pathData.color,
                            style = Stroke(
                                width = pathData.strokeWidth,
                                cap = StrokeCap.Round,
                                join = StrokeJoin.Round
                            )
                        )
                    }
                    
                    // Draw current path
                    if (isDrawing) {
                        drawPath(
                            path = currentPath.path,
                            color = currentPath.color,
                            style = Stroke(
                                width = currentPath.strokeWidth,
                                cap = StrokeCap.Round,
                                join = StrokeJoin.Round
                            )
                        )
                    }
                }
            }
            
            // Tools panel
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shadowElevation = 8.dp,
                color = MaterialTheme.colorScheme.surface
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    // Color palette
                    Text(
                        text = "Colors",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold
                    )
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(predefinedColors) { color ->
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .background(color, CircleShape)
                                    .border(
                                        width = if (color == currentColor) 3.dp else 1.dp,
                                        color = if (color == currentColor) MaterialTheme.colorScheme.primary else Color.Gray,
                                        shape = CircleShape
                                    )
                                    .clickable { currentColor = color }
                            )
                        }
                        
                        item {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .background(Color.Transparent, CircleShape)
                                    .border(2.dp, Color.Gray, CircleShape)
                                    .clickable { showColorPicker = true },
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    Icons.Default.Palette,
                                    contentDescription = "More colors",
                                    tint = Color.Gray
                                )
                            }
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    // Brush sizes
                    Text(
                        text = "Brush Size",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold
                    )
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(brushSizes) { size ->
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .background(
                                        color = if (size == brushSize) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surface,
                                        shape = CircleShape
                                    )
                                    .border(
                                        width = 2.dp,
                                        color = if (size == brushSize) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline,
                                        shape = CircleShape
                                    )
                                    .clickable { brushSize = size },
                                contentAlignment = Alignment.Center
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size((size / 2).dp)
                                        .background(
                                            color = if (size == brushSize) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface,
                                            shape = CircleShape
                                        )
                                )
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Color picker dialog
    if (showColorPicker) {
        ColorPickerDialog(
            initialColor = currentColor,
            onColorSelected = { color ->
                currentColor = color
                showColorPicker = false
            },
            onDismiss = { showColorPicker = false }
        )
    }
    
    // Save dialog
    if (showSaveDialog) {
        SaveOptionsDialog(
            onSaveToNote = {
                val uri = saveDrawingToInternal(context, paths, currentPath.takeIf { isDrawing }, canvasSize)
                onSave(uri, false)
            },
            onSaveToBoth = {
                val uri = saveDrawingToInternal(context, paths, currentPath.takeIf { isDrawing }, canvasSize)
                saveDrawingToGallery(context, paths, currentPath.takeIf { isDrawing }, canvasSize)
                onSave(uri, true)
            },
            onDismiss = { showSaveDialog = false }
        )
    }
}

@Composable
private fun ColorPickerDialog(
    initialColor: Color,
    onColorSelected: (Color) -> Unit,
    onDismiss: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .width(300.dp)
                .wrapContentHeight(),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "Choose Color",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // RGB sliders
                var red by remember { mutableStateOf(initialColor.red) }
                var green by remember { mutableStateOf(initialColor.green) }
                var blue by remember { mutableStateOf(initialColor.blue) }
                
                val selectedColor = Color(red, green, blue)
                
                // Color preview
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(60.dp)
                        .background(selectedColor, RoundedCornerShape(8.dp))
                        .border(1.dp, Color.Gray, RoundedCornerShape(8.dp))
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Red slider
                Text("Red", fontSize = 12.sp, color = Color.Red)
                Slider(
                    value = red,
                    onValueChange = { red = it },
                    valueRange = 0f..1f,
                    colors = SliderDefaults.colors(thumbColor = Color.Red, activeTrackColor = Color.Red)
                )
                
                // Green slider
                Text("Green", fontSize = 12.sp, color = Color.Green)
                Slider(
                    value = green,
                    onValueChange = { green = it },
                    valueRange = 0f..1f,
                    colors = SliderDefaults.colors(thumbColor = Color.Green, activeTrackColor = Color.Green)
                )
                
                // Blue slider
                Text("Blue", fontSize = 12.sp, color = Color.Blue)
                Slider(
                    value = blue,
                    onValueChange = { blue = it },
                    valueRange = 0f..1f,
                    colors = SliderDefaults.colors(thumbColor = Color.Blue, activeTrackColor = Color.Blue)
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    TextButton(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Cancel")
                    }
                    
                    Button(
                        onClick = { onColorSelected(selectedColor) },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("OK")
                    }
                }
            }
        }
    }
}

@Composable
private fun SaveOptionsDialog(
    onSaveToNote: () -> Unit,
    onSaveToBoth: () -> Unit,
    onDismiss: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .width(300.dp)
                .wrapContentHeight(),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "Save Drawing",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Text(
                    text = "Where would you like to save your drawing?",
                    style = MaterialTheme.typography.bodyMedium
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Save options
                Button(
                    onClick = onSaveToNote,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.AutoMirrored.Filled.Note, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Save to Note Only")
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Button(
                    onClick = onSaveToBoth,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.Photo, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Save to Note & Gallery")
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                TextButton(
                    onClick = onDismiss,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Cancel")
                }
            }
        }
    }
}

private data class PathData(
    val path: Path = Path(),
    val color: Color = Color.Black,
    val strokeWidth: Float = 12f,
    val lastPoint: Offset = Offset.Zero
)

private fun saveDrawingToInternal(context: android.content.Context, paths: List<PathData>, currentPath: PathData?, canvasSize: androidx.compose.ui.geometry.Size): Uri {
    val bitmap = createBitmapFromPaths(paths, currentPath, canvasSize)
    
    val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
    val fileName = "Drawing_$timeStamp.png"
    val file = File(context.filesDir, fileName)
    
    FileOutputStream(file).use { out ->
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
    }
    
    return FileProvider.getUriForFile(
        context,
        "${context.packageName}.provider",
        file
    )
}

private fun saveDrawingToGallery(context: android.content.Context, paths: List<PathData>, currentPath: PathData?, canvasSize: androidx.compose.ui.geometry.Size) {
    val bitmap = createBitmapFromPaths(paths, currentPath, canvasSize)
    
    val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
    val fileName = "Drawing_$timeStamp.png"
    
    val contentValues = android.content.ContentValues().apply {
        put(MediaStore.Images.Media.DISPLAY_NAME, fileName)
        put(MediaStore.Images.Media.MIME_TYPE, "image/png")
        put(MediaStore.Images.Media.RELATIVE_PATH, android.os.Environment.DIRECTORY_PICTURES)
    }
    
    val uri = context.contentResolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues)
    uri?.let { imageUri ->
        context.contentResolver.openOutputStream(imageUri)?.use { outputStream ->
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
        }
    }
}

private fun createBitmapFromPaths(paths: List<PathData>, currentPath: PathData?, canvasSize: androidx.compose.ui.geometry.Size): Bitmap {
    // Use actual canvas size if available, otherwise fallback to default size
    val width = if (canvasSize.width > 0) canvasSize.width.toInt() else 800
    val height = if (canvasSize.height > 0) canvasSize.height.toInt() else 600
    
    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
    val canvas = AndroidCanvas(bitmap)
    
    // White background
    canvas.drawColor(android.graphics.Color.WHITE)
    
    // Draw paths
    paths.forEach { pathData ->
        val paint = AndroidPaint().apply {
            color = pathData.color.toArgb()
            strokeWidth = pathData.strokeWidth
            style = AndroidPaint.Style.STROKE
            strokeCap = AndroidPaint.Cap.ROUND
            strokeJoin = AndroidPaint.Join.ROUND
            isAntiAlias = true
            isDither = true
        }
        canvas.drawPath(pathData.path.asAndroidPath(), paint)
    }
    
    // Draw current path if exists
    currentPath?.let { pathData ->
        val paint = AndroidPaint().apply {
            color = pathData.color.toArgb()
            strokeWidth = pathData.strokeWidth
            style = AndroidPaint.Style.STROKE
            strokeCap = AndroidPaint.Cap.ROUND
            strokeJoin = AndroidPaint.Join.ROUND
            isAntiAlias = true
            isDither = true
        }
        canvas.drawPath(pathData.path.asAndroidPath(), paint)
    }
    
    return bitmap
} 