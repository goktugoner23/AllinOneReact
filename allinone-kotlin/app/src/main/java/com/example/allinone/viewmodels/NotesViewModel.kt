package com.example.allinone.viewmodels

import android.app.Application
import android.content.Context
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.asLiveData
import androidx.lifecycle.viewModelScope
import com.example.allinone.data.Note
import com.example.allinone.firebase.FirebaseRepository
import com.example.allinone.firebase.FirebaseIdManager
import com.example.allinone.firebase.DataChangeNotifier
import com.example.allinone.ui.components.MediaAttachment
import com.example.allinone.ui.components.MediaType
import com.example.allinone.ui.components.RichTextState
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch
import java.io.File
import java.util.Date

class NotesViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = FirebaseRepository(application)
    private val idManager = FirebaseIdManager()

    private val _allNotes = MutableLiveData<List<Note>>(emptyList())
    val allNotes: LiveData<List<Note>> = _allNotes

    // Add isLoading property
    val isLoading: LiveData<Boolean> = repository.isLoading
    
    // Enhanced state management
    private val _uploadProgress = MutableStateFlow<Float>(0f)
    val uploadProgress: StateFlow<Float> = _uploadProgress.asStateFlow()
    
    private val _isUploading = MutableStateFlow(false)
    val isUploading: StateFlow<Boolean> = _isUploading.asStateFlow()
    
    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    init {
        // Collect notes from the repository flow
        viewModelScope.launch {
            repository.notes.collect { notes ->
                _allNotes.value = notes
            }
        }
        
        // Monitor error messages
        viewModelScope.launch {
            repository.errorMessage.observeForever { error ->
                _errorMessage.value = error
            }
        }
    }

    fun addNote(title: String, content: String, imageUris: String? = null, videoUris: String? = null, voiceNoteUris: String? = null) {
        viewModelScope.launch {
            // Get next sequential ID for notes
            val noteId = idManager.getNextId("notes")

            val note = Note(
                id = noteId,
                title = title,
                content = content,
                date = Date(),
                imageUris = imageUris,
                videoUris = videoUris,
                voiceNoteUris = voiceNoteUris,
                lastEdited = Date(),
                isRichText = true
            )
            // Add note to Firebase
            repository.insertNote(note)

            // Notify about data change
            DataChangeNotifier.notifyNotesChanged()

            // Refresh notes to ensure UI consistency
            repository.refreshNotes()
        }
    }

    /**
     * Add a new note with rich text content and media attachments
     */
    fun addRichNote(
        title: String,
        richTextState: RichTextState,
        mediaAttachments: List<MediaAttachment> = emptyList()
    ) {
        viewModelScope.launch {
            try {
                _isUploading.value = true
                
                // Get next sequential ID for notes
                val noteId = idManager.getNextId("notes")
                
                // Separate media by type (keeping local URIs for FirebaseManager to handle)
                val imageUris = mediaAttachments
                    .filter { it.type == MediaType.IMAGE }
                    .joinToString(",") { it.uri }
                
                val videoUris = mediaAttachments
                    .filter { it.type == MediaType.VIDEO }
                    .joinToString(",") { it.uri }
                
                val voiceNoteUris = mediaAttachments
                    .filter { it.type == MediaType.AUDIO }
                    .joinToString(",") { it.uri }
                
                val note = Note(
                    id = noteId,
                    title = title,
                    content = richTextState.text,
                    date = Date(),
                    imageUris = imageUris.ifEmpty { null },
                    videoUris = videoUris.ifEmpty { null },
                    voiceNoteUris = voiceNoteUris.ifEmpty { null },
                    lastEdited = Date(),
                    isRichText = true
                )
                
                // Add note to Firebase
                repository.insertNote(note)
                
                // Notify about data change
                DataChangeNotifier.notifyNotesChanged()
                
                // Refresh notes to ensure UI consistency
                repository.refreshNotes()
                
                _isUploading.value = false
            } catch (e: Exception) {
                _errorMessage.value = "Failed to save note: ${e.message}"
                _isUploading.value = false
            }
        }
    }

    fun updateNote(note: Note) {
        viewModelScope.launch {
            // Update note in Firebase
            repository.updateNote(note)

            // Notify about data change
            DataChangeNotifier.notifyNotesChanged()

            // Refresh notes to ensure UI consistency
            repository.refreshNotes()
        }
    }

    fun deleteNote(note: Note) {
        viewModelScope.launch {
            // Delete note from Firebase
            repository.deleteNote(note)

            // Notify about data change
            DataChangeNotifier.notifyNotesChanged()

            // Refresh notes to ensure UI consistency
            repository.refreshNotes()
        }
    }

    fun refreshData() {
        viewModelScope.launch {
            repository.refreshNotes()
        }
    }

    /**
     * Get the ID of the last created note
     * This is used when creating a new note with voice notes
     */
    fun getLastCreatedNoteId(): Long {
        // Get the highest ID from the current notes list
        return _allNotes.value?.maxByOrNull { it.id }?.id ?: 0L
    }

    /**
     * Check if a note has voice notes in Firestore
     * This is used to determine if the voice note indicator should be shown
     */
    fun checkNoteVoiceNotes(noteId: Long, callback: (Boolean) -> Unit) {
        viewModelScope.launch {
            val note = _allNotes.value?.find { it.id == noteId }
            val hasVoiceNotes = !note?.voiceNoteUris.isNullOrEmpty()
            callback(hasVoiceNotes)
        }
    }
    
    /**
     * Update an existing note with rich text content and media attachments
     */
    fun updateRichNote(
        noteId: Long,
        title: String,
        richTextState: RichTextState,
        mediaAttachments: List<MediaAttachment> = emptyList()
    ) {
        viewModelScope.launch {
            try {
                _isUploading.value = true
                
                // Separate media by type (keeping local URIs for FirebaseManager to handle)
                val imageUris = mediaAttachments
                    .filter { it.type == MediaType.IMAGE }
                    .joinToString(",") { it.uri }
                
                val videoUris = mediaAttachments
                    .filter { it.type == MediaType.VIDEO }
                    .joinToString(",") { it.uri }
                
                val voiceNoteUris = mediaAttachments
                    .filter { it.type == MediaType.AUDIO }
                    .joinToString(",") { it.uri }
                
                val note = Note(
                    id = noteId,
                    title = title,
                    content = richTextState.text,
                    date = Date(),
                    imageUris = imageUris.ifEmpty { null },
                    videoUris = videoUris.ifEmpty { null },
                    voiceNoteUris = voiceNoteUris.ifEmpty { null },
                    lastEdited = Date(),
                    isRichText = true
                )
                
                // Update note in Firebase
                repository.updateNote(note)
                
                // Notify about data change
                DataChangeNotifier.notifyNotesChanged()
                
                // Refresh notes to ensure UI consistency
                repository.refreshNotes()
                
                _isUploading.value = false
            } catch (e: Exception) {
                _errorMessage.value = "Failed to update note: ${e.message}"
                _isUploading.value = false
            }
        }
    }
    

    
    /**
     * Upload a voice note file (handled by FirebaseManager.saveNote)
     */
    fun uploadVoiceNote(
        audioFile: File,
        onSuccess: (String) -> Unit,
        @Suppress("UNUSED_PARAMETER") onError: (String) -> Unit
    ) {
        // Return the file URI for FirebaseManager to handle the upload
        val fileUri = Uri.fromFile(audioFile).toString()
        onSuccess(fileUri)
    }

    /**
     * Clear error message
     */
    fun clearErrorMessage() {
        _errorMessage.value = null
    }
    
    /**
     * Get media attachments from a note
     */
    fun getMediaAttachmentsFromNote(note: Note): List<MediaAttachment> {
        val attachments = mutableListOf<MediaAttachment>()
        
        // Process images
        note.imageUris?.let { uris ->
            uris.split(",").filter { it.isNotEmpty() }.forEach { uri ->
                attachments.add(
                    MediaAttachment(
                        uri = uri,
                        type = MediaType.IMAGE,
                        name = "Image"
                    )
                )
            }
        }
        
        // Process videos
        note.videoUris?.let { uris ->
            uris.split(",").filter { it.isNotEmpty() }.forEach { uri ->
                attachments.add(
                    MediaAttachment(
                        uri = uri,
                        type = MediaType.VIDEO,
                        name = "Video"
                    )
                )
            }
        }
        
        // Process voice notes
        note.voiceNoteUris?.let { uris ->
            uris.split(",").filter { it.isNotEmpty() }.forEach { uri ->
                attachments.add(
                    MediaAttachment(
                        uri = uri,
                        type = MediaType.AUDIO,
                        name = "Voice Note"
                    )
                )
            }
        }
        
        return attachments
    }
    
    /**
     * Get a note by ID
     */
    fun getNoteById(noteId: Long): Note? {
        return _allNotes.value?.find { it.id == noteId }
    }
    
    /**
     * Search notes by text content
     */
    suspend fun searchNotes(query: String): List<Note> {
        return allNotes.value?.filter { 
            it.title.contains(query, ignoreCase = true) || 
            it.content.contains(query, ignoreCase = true) 
        } ?: emptyList()
    }
    
    /**
     * Get recently edited notes
     */
    suspend fun getRecentlyEditedNotes(limit: Int = 10): List<Note> {
        return allNotes.value?.sortedByDescending { it.lastEdited }?.take(limit) ?: emptyList()
    }
    
    /**
     * Get notes by type (rich text or plain text)
     */
    suspend fun getNotesByType(hasImages: Boolean? = null, hasAudio: Boolean? = null): List<Note> {
        return allNotes.value?.filter { note ->
            when {
                hasImages == true && hasAudio == true -> !note.imageUris.isNullOrEmpty() && !note.voiceNoteUris.isNullOrEmpty()
                hasImages == true -> !note.imageUris.isNullOrEmpty()
                hasAudio == true -> !note.voiceNoteUris.isNullOrEmpty()
                else -> true
            }
        } ?: emptyList()
    }
    
    /**
     * Export note content as plain text
     */
    fun exportNoteAsText(note: Note): String {
        val builder = StringBuilder()
        
        builder.append("Title: ${note.title}\n")
        builder.append("Created: ${note.date}\n")
        builder.append("Last Edited: ${note.lastEdited}\n")
        builder.append("Content Type: ${if (note.isRichText) "Rich Text" else "Plain Text"}\n")
        builder.append("\n")
        builder.append("Content:\n")
        builder.append(note.content)
        
        val mediaAttachments = getMediaAttachmentsFromNote(note)
        if (mediaAttachments.isNotEmpty()) {
            builder.append("\n\nAttachments:\n")
            mediaAttachments.forEach { attachment ->
                builder.append("- ${attachment.type}: ${attachment.name ?: "Unnamed"}\n")
            }
        }
        
        return builder.toString()
    }
    
    /**
     * Get note statistics
     */
    fun getNoteStatistics(): NoteStatistics {
        val notes = _allNotes.value ?: emptyList()
        return NoteStatistics(
            totalNotes = notes.size,
            richTextNotes = notes.count { it.isRichText },
            plainTextNotes = notes.count { !it.isRichText },
            notesWithImages = notes.count { !it.imageUris.isNullOrEmpty() },
            notesWithVideos = notes.count { !it.videoUris.isNullOrEmpty() },
            notesWithVoiceNotes = notes.count { !it.voiceNoteUris.isNullOrEmpty() }
        )
    }
}

data class NoteStatistics(
    val totalNotes: Int,
    val richTextNotes: Int,
    val plainTextNotes: Int,
    val notesWithImages: Int,
    val notesWithVideos: Int,
    val notesWithVoiceNotes: Int
)