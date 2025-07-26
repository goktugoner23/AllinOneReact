package com.example.allinone.ui.compose.wt

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class WTRegistryScreenTest {
    
    @get:Rule
    val composeTestRule = createComposeRule()
    
    @Test
    fun wtRegistryScreen_displaysCorrectTabs() {
        composeTestRule.setContent {
            WTRegistryScreen()
        }
        
        // Verify all tabs are present
        composeTestRule.onNodeWithText("Students").assertExists()
        composeTestRule.onNodeWithText("Register").assertExists()
        composeTestRule.onNodeWithText("Lessons").assertExists()
        composeTestRule.onNodeWithText("Seminars").assertExists()
    }
    
    @Test
    fun wtRegistryScreen_canNavigateBetweenTabs() {
        composeTestRule.setContent {
            WTRegistryScreen()
        }
        
        // Initially should be on Students tab
        composeTestRule.onNodeWithText("Students").assertIsSelected()
        
        // Click Register tab
        composeTestRule.onNodeWithText("Register").performClick()
        composeTestRule.onNodeWithText("Register").assertIsSelected()
        
        // Click Lessons tab
        composeTestRule.onNodeWithText("Lessons").performClick()
        composeTestRule.onNodeWithText("Lessons").assertIsSelected()
        
        // Click Seminars tab
        composeTestRule.onNodeWithText("Seminars").performClick()
        composeTestRule.onNodeWithText("Seminars").assertIsSelected()
    }
    
    @Test
    fun studentsTab_displaysAddButton() {
        composeTestRule.setContent {
            WTRegistryScreen()
        }
        
        // Should be on Students tab by default
        composeTestRule.onNodeWithText("Add Student").assertExists()
    }
    
    @Test
    fun registerTab_displaysAddButton() {
        composeTestRule.setContent {
            WTRegistryScreen()
        }
        
        // Navigate to Register tab
        composeTestRule.onNodeWithText("Register").performClick()
        composeTestRule.onNodeWithText("Add Registration").assertExists()
    }
    
    @Test
    fun lessonsTab_displaysAddButton() {
        composeTestRule.setContent {
            WTRegistryScreen()
        }
        
        // Navigate to Lessons tab
        composeTestRule.onNodeWithText("Lessons").performClick()
        composeTestRule.onNodeWithText("Add Lesson").assertExists()
    }
    
    @Test
    fun seminarsTab_displaysAddButton() {
        composeTestRule.setContent {
            WTRegistryScreen()
        }
        
        // Navigate to Seminars tab
        composeTestRule.onNodeWithText("Seminars").performClick()
        composeTestRule.onNodeWithText("Add Seminar").assertExists()
    }
} 