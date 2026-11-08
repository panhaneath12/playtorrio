package com.playtorrio.tv;

import android.graphics.Color;
import android.net.http.SslError;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.SslErrorHandler;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Prevent TV screen / projector bulb from sleeping during streaming
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        
        // Optimize WebView for Android TV & Projector D-Pad remote input
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.setBackgroundColor(Color.parseColor("#08090D"));
            webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
            
            // Enable third-party cookies so video iframe providers (VidLink, VidSrc, etc.) can authenticate stream sessions
            CookieManager cookieManager = CookieManager.getInstance();
            cookieManager.setAcceptCookie(true);
            cookieManager.setAcceptThirdPartyCookies(webView, true);
            
            WebSettings settings = webView.getSettings();
            
            // CRITICAL FOR STREAMING: Use desktop Chrome User-Agent to prevent Cloudflare Turnstile bot blocks on Android TV
            settings.setUserAgentString("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
            
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            
            // Allow iframes and embedded players to function properly
            settings.setSupportMultipleWindows(false);
            settings.setJavaScriptCanOpenWindowsAutomatically(false);

            // Enable D-Pad remote control focus
            webView.setFocusable(true);
            webView.setFocusableInTouchMode(true);
            webView.requestFocus();

            // Custom BridgeWebViewClient:
            // 1. Never block or hijack subframe (iframe video player) navigations
            // 2. Allow video CDNs with expired intermediate certificates on Android 9
            getBridge().setWebViewClient(new BridgeWebViewClient(getBridge()) {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                    if (!request.isForMainFrame()) {
                        return false; // Let all video embed iframes and subframes load naturally!
                    }
                    return super.shouldOverrideUrlLoading(view, request);
                }

                @Override
                public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                    handler.proceed(); // Prevent Android 9 from killing streams with SSL handshake warnings
                }
            });
        }
    }
}
