package com.deeplinkapp

import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class SharedTextModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "SharedText"
    }

    @ReactMethod
    fun getSharedText(promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("SharedData", Context.MODE_PRIVATE)
            val sharedText = prefs.getString("sharedText", null)
            
            if (sharedText != null) {
                // Clear the shared text after reading
                prefs.edit().remove("sharedText").apply()
                promise.resolve(sharedText)
            } else {
                promise.resolve(null)
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    companion object {
        private var latestSharedText: String? = null

        fun notifyNewSharedText(text: String) {
            latestSharedText = text
        }
    }
}