package com.deeplinkapp

import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    handleIntent(intent)
  }

  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    intent?.let {
      setIntent(it)
      handleIntent(it)
    }
  }

  private fun handleIntent(intent: Intent?) {
    intent?.let {
      val action = it.action
      val type = it.type

      // Handle shared text from other apps
      if (Intent.ACTION_SEND == action && "text/plain" == type) {
        val sharedText = it.getStringExtra(Intent.EXTRA_TEXT)
        sharedText?.let { text ->
          // Save to SharedPreferences so React Native can access it
          val prefs = getSharedPreferences("SharedData", MODE_PRIVATE)
          prefs.edit().putString("sharedText", text).apply()
          
          // Notify React Native that new data is available
          SharedTextModule.notifyNewSharedText(text)
        }
      }
    }
  }

  override fun getMainComponentName(): String = "DeepLinkApp"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}