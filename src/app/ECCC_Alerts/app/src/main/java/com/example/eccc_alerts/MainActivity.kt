package com.example.eccc_alerts

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.*
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.google.firebase.messaging.FirebaseMessaging

class MainActivity : AppCompatActivity() {
    private val provinces = linkedMapOf(
        "AB" to "Alberta",
        "BC" to "British Columbia",
        "MB" to "Manitoba",
        "NB" to "New Brunswick",
        "NL" to "Newfoundland and Labrador",
        "NS" to "Nova Scotia",
        "NT" to "Northwest Territories",
        "NU" to "Nunavut",
        "ON" to "Ontario",
        "PE" to "Prince Edward Island",
        "QC" to "Quebec",
        "SK" to "Saskatchewan",
        "YT" to "Yukon"
    )

    private val permissionLauncher = registerForActivityResult(ActivityResultContracts.RequestPermission()) {}

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        askNotificationPermission()

        val options = findViewById<Spinner>(R.id.options)
        val subscribe = findViewById<Button>(R.id.subscribe)
        val unsubscribe = findViewById<Button>(R.id.unsubscribe)

        val provinceCodes = provinces.keys.toList()
        val provinceNames = provinces.values.toList()

        options.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, provinceNames)

        subscribe.setOnClickListener {
            val provinceCode = provinceCodes[options.selectedItemPosition]
            val provinceName = provinceNames[options.selectedItemPosition]

            // Subscribe to Firebase Messaging Topic
            FirebaseMessaging.getInstance().subscribeToTopic(provinceCode)

            Toast.makeText(this, "Thanks for Subscribing to $provinceName ECCC Alerts!", Toast.LENGTH_SHORT).show()
        }

        unsubscribe.setOnClickListener {
            provinceCodes.forEach { FirebaseMessaging.getInstance().unsubscribeFromTopic(it) }
            Toast.makeText(this, "Unsubscribed from all alerts.", Toast.LENGTH_SHORT).show()
        }
    }

    private fun askNotificationPermission() {
        if (Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
            != PackageManager.PERMISSION_GRANTED
        ) {
            permissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }
}
