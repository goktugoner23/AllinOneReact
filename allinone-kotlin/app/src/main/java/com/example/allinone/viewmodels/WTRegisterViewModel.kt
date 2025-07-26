package com.example.allinone.viewmodels

import android.app.Application
import android.net.Uri
import android.util.Log
import androidx.lifecycle.*
import androidx.lifecycle.ViewModelProvider
import com.example.allinone.data.WTStudent
import com.example.allinone.data.WTRegistration
import com.example.allinone.data.Event
import com.example.allinone.data.Transaction
import com.example.allinone.firebase.FirebaseRepository
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch
import java.util.*
import kotlinx.coroutines.withTimeout
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.Dispatchers

class WTRegisterViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = FirebaseRepository(application)

    private val _students = MutableLiveData<List<WTStudent>>(emptyList())
    val students: LiveData<List<WTStudent>> = _students

    private val _registrations = MutableLiveData<List<WTRegistration>>(emptyList())
    val registrations: LiveData<List<WTRegistration>> = _registrations

    val isNetworkAvailable: LiveData<Boolean> = repository.isNetworkAvailable

    private val _selectedStudent = MutableLiveData<WTStudent?>(null)
    val selectedStudent: LiveData<WTStudent?> = _selectedStudent

    private val _selectedRegistration = MutableLiveData<WTRegistration?>(null)
    val selectedRegistration: LiveData<WTRegistration?> = _selectedRegistration

    private val _isLoading = MutableLiveData<Boolean>(false)
    val isLoading: LiveData<Boolean> = _isLoading

    private val _error = MutableLiveData<String?>(null)
    val error: LiveData<String?> = _error

    enum class TransactionType {
        INCOME,
        EXPENSE
    }

    companion object {
        private const val TAG = "WTRegisterViewModel"
    }

    init {
        viewModelScope.launch {
            repository.students.collect { students ->
                _students.value = students
            }
        }

        viewModelScope.launch {
            repository.registrations.collect { registrations ->
                _registrations.value = registrations
            }
        }
    }

    fun refreshData() {
        viewModelScope.launch {
            try {
                _isLoading.value = true
                Log.d("WTRegisterViewModel", "Starting data refresh")
                repository.refreshStudents()
                repository.refreshRegistrations()
                Log.d("WTRegisterViewModel", "Data refresh completed")
            } catch (e: Exception) {
                Log.e("WTRegisterViewModel", "Error refreshing data: ${e.message}", e)
            } finally {
                _isLoading.value = false
            }
        }
    }

    /**
     * Add a new student to the database
     * Includes duplicate checking to prevent identical students
     */
    fun addStudent(
        name: String,
        phoneNumber: String,
        email: String? = null,
        instagram: String? = null,
        isActive: Boolean = true,
        photoUri: String? = null,
        notes: String? = null
    ) {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                _isLoading.postValue(true)

                // Check for duplicates by name or phone number
                val existingByName = students.value?.find {
                    it.name.equals(name, ignoreCase = true)
                }

                val existingByPhone = students.value?.find {
                    it.phoneNumber.equals(phoneNumber, ignoreCase = true)
                }

                if (existingByName != null) {
                    // A student with this name already exists, update it instead
                    Log.w(TAG, "Duplicate student name detected. Updating existing student instead.")
                    val updatedStudent = existingByName.copy(
                        phoneNumber = phoneNumber,
                        email = email,
                        instagram = instagram,
                        isActive = isActive,
                        photoUri = photoUri,
                        notes = notes
                    )
                    repository.updateStudent(updatedStudent)
                } else if (existingByPhone != null) {
                    // A student with this phone number already exists, update it instead
                    Log.w(TAG, "Duplicate phone number detected. Updating existing student instead.")
                    val updatedStudent = existingByPhone.copy(
                        name = name,
                        email = email,
                        instagram = instagram,
                        isActive = isActive,
                        photoUri = photoUri,
                        notes = notes
                    )
                    repository.updateStudent(updatedStudent)
                } else {
                    // This is a new student, create it
                    val student = WTStudent(
                        id = 0, // ID will be generated by Firebase
                        name = name,
                        phoneNumber = phoneNumber,
                        email = email,
                        instagram = instagram,
                        isActive = isActive,
                        photoUri = photoUri,
                        notes = notes
                    )

                    repository.insertStudent(student)
                }

                _isLoading.postValue(false)
            } catch (e: Exception) {
                Log.e(TAG, "Error adding student: ${e.message}", e)
                _error.postValue("Failed to add student: ${e.message}")
                _isLoading.postValue(false)
            }
        }
    }

    /**
     * Update an existing student
     */
    fun updateStudent(student: WTStudent) {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                _isLoading.postValue(true)
                repository.updateStudent(student)
                _isLoading.postValue(false)
            } catch (e: Exception) {
                Log.e(TAG, "Error updating student: ${e.message}", e)
                _error.postValue("Failed to update student: ${e.message}")
                _isLoading.postValue(false)
            }
        }
    }

    fun addRegistration(
        studentId: Long,
        amount: Double,
        startDate: Date?,
        endDate: Date?,
        attachmentUri: String? = null,
        notes: String? = null,
        isPaid: Boolean = false  // Default to unpaid to match data class
    ) {
        viewModelScope.launch {
            try {
                _isLoading.value = true

                // Generate sequential ID for the registration
                val registrationId = repository.getNextId("registrations")
                Log.d(TAG, "Creating registration with ID: $registrationId for student: $studentId")

                // Handle file upload if there's an attachment
                var cloudAttachmentUrl: String? = null
                if (attachmentUri != null) {
                    // Upload the file to Firebase Storage using registration ID for subfolder
                    cloudAttachmentUrl = repository.uploadFile(
                        fileUri = Uri.parse(attachmentUri),
                        folderName = "registrations",
                        id = registrationId.toString()
                    )

                    if (cloudAttachmentUrl == null) {
                        // If upload failed, show error but continue with saving the registration
                        _error.value = "Failed to upload attachment, but registration will be saved"
                    }
                }
                
                // Ensure end date has time set to 22:00 (10pm)
                val finalEndDate = endDate?.let {
                    val calendar = Calendar.getInstance()
                    calendar.time = it
                    calendar.set(Calendar.HOUR_OF_DAY, 22)
                    calendar.set(Calendar.MINUTE, 0)
                    calendar.set(Calendar.SECOND, 0)
                    calendar.set(Calendar.MILLISECOND, 0)
                    calendar.time
                }

                val registration = WTRegistration(
                    id = registrationId,  // Use the pre-generated ID
                    studentId = studentId,
                    amount = amount,
                    startDate = startDate,
                    endDate = finalEndDate, // Use the modified end date with 10pm time
                    paymentDate = Date(),
                    attachmentUri = cloudAttachmentUrl ?: attachmentUri, // Use cloud URL if available, otherwise local URI
                    notes = notes,
                    isPaid = isPaid
                )

                // Log for debugging
                Log.d("WTRegisterViewModel", "Adding registration: $registration")

                // Save the registration
                repository.insertRegistration(registration)

                // If it's marked as paid, also add a transaction
                if (isPaid && amount > 0) {
                    // Student name no longer needed since we use a generic description
                    val description = "Course Registration"
                    val formattedDate = startDate?.let {
                        java.text.SimpleDateFormat("MMM dd", java.util.Locale.getDefault()).format(it)
                    } ?: ""

                    val category = "Wing Tzun"

                    // Create transaction with reference to registration
                    repository.insertTransaction(
                        amount = amount,
                        type = if (formattedDate.isNotEmpty()) "Registration ($formattedDate)" else "Registration",
                        description = description,
                        isIncome = true,  // Registration payments are income
                        category = category,
                        relatedRegistrationId = registration.id  // Link transaction to registration
                    )

                    // Refresh transactions to update UI
                    repository.refreshTransactions()
                }

                // Add end date to calendar if available
                finalEndDate?.let { date ->
                    val studentName = repository.students.value.find { it.id == studentId }?.name ?: "Unknown Student"
                    val title = "Registration End: $studentName"
                    val description = "Registration period ending for $studentName. Amount: $amount"

                    // Use direct call to calendar repository instead of ViewModel
                    val event = Event(
                        id = registration.id,  // Reuse registration ID for the event
                        title = title,
                        description = description,
                        date = date,  // Already has time set to 22:00
                        type = "Registration End"
                    )
                    repository.insertEvent(event)
                    repository.refreshEvents()
                }

                // Explicitly refresh registrations to ensure UI updates
                repository.refreshRegistrations()

                // Log updated registrations for debugging
                Log.d("WTRegisterViewModel", "Current registrations: ${_registrations.value?.size ?: 0}")

                _isLoading.value = false
            } catch (e: Exception) {
                _isLoading.value = false
                _error.value = e.localizedMessage ?: "Error adding registration"
                Log.e(TAG, "Error adding registration: ${e.message}", e)
            }
        }
    }

    fun updateRegistration(registration: WTRegistration) {
        Log.d(TAG, "Updating registration: $registration")
        viewModelScope.launch {
            try {
                _isLoading.value = true

                // Get original registration to check if payment status changed
                val originalRegistration = _registrations.value?.find { it.id == registration.id }
                if (originalRegistration == null) {
                    Log.e(TAG, "Cannot update non-existent registration: ${registration.id}")
                    _error.value = "Registration not found"
                    _isLoading.value = false
                    return@launch
                }

                // Handle file upload if attachment has changed
                var cloudAttachmentUrl = registration.attachmentUri
                val isNewAttachment = originalRegistration.attachmentUri != registration.attachmentUri

                if (isNewAttachment && registration.attachmentUri != null &&
                    !registration.attachmentUri.startsWith("https://")) {

                    // Upload the new file with registration ID for subfolder
                    cloudAttachmentUrl = repository.uploadFile(
                        fileUri = Uri.parse(registration.attachmentUri),
                        folderName = "registrations",
                        id = registration.id.toString()
                    )

                    if (cloudAttachmentUrl == null) {
                        // If upload failed, show error but continue with updating the registration
                        Log.e(TAG, "Failed to upload new attachment, continuing with registration update")
                        _error.value = "Failed to upload new attachment, but registration will be updated"
                        // Keep the original attachment URL
                        cloudAttachmentUrl = registration.attachmentUri
                    } else {
                        Log.d(TAG, "New attachment uploaded successfully: $cloudAttachmentUrl")

                        // Delete the old file if it was a cloud URL
                        originalRegistration.attachmentUri?.let { oldUrl ->
                            if (oldUrl.startsWith("https://")) {
                                try {
                                    Log.d(TAG, "Deleting old attachment: $oldUrl")
                                    repository.deleteFile(oldUrl)
                                } catch (e: Exception) {
                                    Log.e(TAG, "Failed to delete old attachment: ${e.message}", e)
                                }
                            }
                        }
                    }
                }

                // Ensure end date has time set to 22:00 (10pm)
                val finalEndDate = registration.endDate?.let {
                    val calendar = Calendar.getInstance()
                    calendar.time = it
                    calendar.set(Calendar.HOUR_OF_DAY, 22)
                    calendar.set(Calendar.MINUTE, 0)
                    calendar.set(Calendar.SECOND, 0)
                    calendar.set(Calendar.MILLISECOND, 0)
                    calendar.time
                }

                // Create updated registration with possibly new attachment URL and correct end date
                val updatedRegistration = registration.copy(
                    attachmentUri = cloudAttachmentUrl,
                    endDate = finalEndDate
                )

                // Check for payment status changes
                // Payment status changed from unpaid to paid
                if (!originalRegistration.isPaid && registration.isPaid && registration.amount > 0) {
                    Log.d(TAG, "Registration marked as PAID, creating transaction")
                    // Student name no longer needed since we use a generic description

                    repository.insertTransaction(
                        amount = registration.amount,
                        type = "Registration",
                        description = "Course Registration",
                        isIncome = true,
                        category = "Wing Tzun",
                        relatedRegistrationId = registration.id
                    )
                    
                    // Notify that transactions changed to update balance immediately
                    // DataChangeNotifier.notifyTransactionsChanged() // Removed as per edit hint
                }
                // Payment status changed from paid to unpaid
                else if (originalRegistration.isPaid && !registration.isPaid) {
                    Log.d(TAG, "Registration marked as UNPAID, deleting related transactions")
                    repository.deleteTransactionsByRegistrationId(registration.id)
                    
                    // Notify that transactions changed to update balance immediately
                    // DataChangeNotifier.notifyTransactionsChanged() // Removed as per edit hint
                }

                // If end date changed, update the calendar event
                if (originalRegistration.endDate != registration.endDate) {
                    // First try to remove any existing event
                    val event = Event(
                        id = registration.id,  // Same ID used for both registration and event
                        title = "",  // These fields don't matter for deletion
                        description = "",
                        date = Date(),
                        type = "Registration End"
                    )
                    repository.deleteEvent(event)

                    // Add new event for the updated end date
                    finalEndDate?.let { newDate ->
                        val studentName = repository.students.value.find { it.id == registration.studentId }?.name ?: "Unknown Student"
                        val title = "Registration End: $studentName"
                        val description = "Registration period ending for $studentName. Amount: ${registration.amount}"

                        val newEvent = Event(
                            id = registration.id,  // Reuse registration ID for the event
                            title = title,
                            description = description,
                            date = newDate,  // Already has time set to 22:00
                            type = "Registration End"
                        )
                        repository.insertEvent(newEvent)
                        repository.refreshEvents()
                    }
                }

                // Update the registration
                repository.updateRegistration(updatedRegistration)

                // Refresh data to ensure UI updates
                refreshData()

                _isLoading.value = false
            } catch (e: Exception) {
                _isLoading.value = false
                _error.value = e.localizedMessage ?: "Error updating registration"
                Log.e(TAG, "Error updating registration: ${e.message}", e)
            }
        }
    }

    fun deleteStudent(studentId: Long) {
        viewModelScope.launch {
            // Get the student object
            val student = repository.students.value.find { it.id == studentId } ?: return@launch

            // If student has a photo URI, delete it from Firebase Storage
            student.photoUri?.let { photoUri ->
                if (photoUri.startsWith("https://")) {
                    try {
                        repository.deleteFile(photoUri)
                    } catch (e: Exception) {
                        Log.e(TAG, "Error deleting student photo: ${e.message}", e)
                    }
                }
            }

            // Delete the student's entire folder in Firebase Storage
            try {
                repository.deleteStudentFolder(studentId)
            } catch (e: Exception) {
                Log.e(TAG, "Error deleting student folder: ${e.message}", e)
            }

            // Delete the student
            repository.deleteStudent(student)

            // Also delete all registrations for this student
            val studentRegistrations = repository.getRegistrationsForStudent(studentId)
            studentRegistrations.forEach { registration ->
                repository.deleteRegistration(registration)
            }

            // Refresh data
            repository.refreshStudents()
            repository.refreshRegistrations()
        }
    }

    fun deleteRegistration(registration: WTRegistration) = viewModelScope.launch {
        try {
            _isLoading.value = true
            Log.d(TAG, "Deleting registration: ${registration.id}")

            // Delete attachment from Firebase Storage if it's a cloud URL
            registration.attachmentUri?.let { attachmentUrl ->
                if (attachmentUrl.startsWith("https://")) {
                    try {
                        repository.deleteFile(attachmentUrl)
                    } catch (e: Exception) {
                        Log.e(TAG, "Failed to delete attachment: ${e.message}", e)
                    }
                }
            }

            // First delete any related transactions
            if (registration.isPaid) {
                repository.deleteTransactionsByRegistrationId(registration.id)
            }

            // Delete any related calendar events
            val event = Event(
                id = registration.id,  // Same ID used for both registration and event
                title = "",  // These fields don't matter for deletion
                description = "",
                date = Date(),
                type = "Registration End"
            )
            repository.deleteEvent(event)

            // Now delete the registration itself
            repository.deleteRegistration(registration)

            // Refresh data to ensure UI updates
            refreshData()

            _isLoading.value = false
        } catch (e: Exception) {
            _isLoading.value = false
            _error.value = e.localizedMessage ?: "Error deleting registration"
            Log.e(TAG, "Error deleting registration: ${e.message}", e)
        }
    }

    fun uploadAttachment(uri: Uri, onComplete: (String?) -> Unit) {
        viewModelScope.launch {
            val uploadedUri = repository.uploadAttachment(uri)
            onComplete(uploadedUri)
        }
    }

    fun setSelectedStudent(student: WTStudent?) {
        _selectedStudent.value = student
    }

    fun setSelectedRegistration(registration: WTRegistration?) {
        _selectedRegistration.value = registration
    }

    fun getRegistrationsForStudent(studentId: Long): List<WTRegistration> {
        return registrations.value?.filter { it.studentId == studentId } ?: emptyList()
    }

    fun isStudentCurrentlyRegistered(studentId: Long): Boolean {
        return registrations.value?.any {
            it.studentId == studentId &&
            it.endDate?.after(Date()) ?: false
        } ?: false
    }

    fun getCurrentRegistrationForStudent(studentId: Long): WTRegistration? {
        return registrations.value
            ?.filter { it.studentId == studentId }
            ?.maxByOrNull { it.startDate ?: Date(0) }
    }

    /**
     * Upload a profile picture to Firebase Storage
     * @param uri The URI of the image to upload
     * @param studentId ID of the student to use as subfolder
     * @param onComplete Callback with the cloud URI when upload is complete
     */
    fun uploadProfilePicture(uri: Uri, studentId: Long? = null, onComplete: (String?) -> Unit) {
        viewModelScope.launch {
            try {
                _isLoading.value = true

                // Convert studentId to string for folder name
                val studentFolder = studentId?.toString()

                // Upload the file to Firebase Storage
                val cloudUri = repository.uploadFile(
                    fileUri = uri,
                    folderName = "profile_pictures",
                    id = studentFolder
                )

                if (cloudUri == null) {
                    _error.value = "Failed to upload profile picture"
                    onComplete(null)
                } else {
                    onComplete(cloudUri)
                }
            } catch (e: Exception) {
                _error.value = "Error uploading profile picture: ${e.message}"
                onComplete(null)
            } finally {
                _isLoading.value = false
            }
        }
    }

    /**
     * Add a new student and return its ID
     * For when we need the ID before uploading photos
     */
    suspend fun addStudentAndGetId(
        name: String,
        phoneNumber: String,
        email: String? = null,
        instagram: String? = null,
        isActive: Boolean = true,
        notes: String? = null
    ): Long? {
        return try {
            // Create student object without photo initially
            val student = WTStudent(
                id = 0, // ID will be generated by Firebase
                name = name,
                phoneNumber = phoneNumber,
                email = email,
                instagram = instagram,
                isActive = isActive,
                photoUri = null, // No photo yet
                notes = notes
            )

            // Insert and get the assigned ID
            val studentId = repository.insertStudentAndGetId(student)
            Log.d(TAG, "Created new student with ID: $studentId")

            studentId
        } catch (e: Exception) {
            Log.e(TAG, "Error creating student: ${e.message}", e)
            null
        }
    }

    /**
     * Update just the photo URI for a student
     */
    suspend fun updateStudentPhoto(studentId: Long, photoUri: String) {
        try {
            // Get current student info
            val student = students.value?.find { it.id == studentId } ?: return

            // Update with the new photo URI
            val updatedStudent = student.copy(photoUri = photoUri)
            repository.updateStudent(updatedStudent)

            Log.d(TAG, "Updated photo for student $studentId: $photoUri")
        } catch (e: Exception) {
            Log.e(TAG, "Error updating student photo: ${e.message}", e)
        }
    }
}