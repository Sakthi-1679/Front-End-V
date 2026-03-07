package com.vkmflowers.fcm

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import com.vkmflowers.R
import com.vkmflowers.ui.SplashActivity
import com.vkmflowers.utils.SessionManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class VkmFirebaseMessagingService : FirebaseMessagingService() {

    companion object {
        const val ACTION_NEW_ORDER = "com.vkmflowers.NEW_ORDER"
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        // Save token to server if user is logged in
        val session = SessionManager(this)
        if (session.isLoggedIn()) {
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    com.vkmflowers.data.network.ApiClient.service.saveFcmToken(
                        com.vkmflowers.data.models.FcmTokenRequest(token)
                    )
                } catch (_: Exception) { }
            }
        }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)

        val title = message.notification?.title ?: message.data["title"] ?: "VKM Flowers"
        val body = message.notification?.body ?: message.data["body"] ?: ""

        showNotification(title, body)

        // Broadcast so open fragments can auto-refresh
        LocalBroadcastManager.getInstance(this)
            .sendBroadcast(Intent(ACTION_NEW_ORDER))
    }

    private fun showNotification(title: String, body: String) {
        val channelId = "vkm_orders"
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(channelId, "Order Notifications", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "Notifications for new orders"
                enableVibration(true)
            }
            manager.createNotificationChannel(channel)
        }

        val intent = Intent(this, SplashActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent, PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.drawable.ic_flower)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .build()

        manager.notify(System.currentTimeMillis().toInt(), notification)
    }
}
