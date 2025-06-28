# 🔑 Fix Firebase Secrets Access Issue

## **Root Cause: Firebase App Hosting Backend Missing Secret Access**

The `auth/invalid-api-key` errors confirm that your Firebase configuration secrets aren't accessible to the App Hosting backend.

---

## 🚀 **SOLUTION 1: Firebase Console (Recommended)**

### **Step 1: Access Firebase Console**
1. Go to https://console.firebase.google.com/project/caf-medroute
2. Navigate to **App Hosting** → Click on `caf-medroute` backend
3. Go to **Settings** or **Environment Variables** tab

### **Step 2: Grant Secret Access**
Look for these secrets and ensure they're **enabled** for the backend:
```
✅ NEXT_PUBLIC_FIREBASE_API_KEY
✅ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN  
✅ NEXT_PUBLIC_FIREBASE_PROJECT_ID
✅ NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
✅ NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
✅ NEXT_PUBLIC_FIREBASE_APP_ID
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
✅ OPENROUTER_API_KEY
✅ GOOGLE_API_KEY
```

### **Step 3: Create Missing Secrets**
If any secrets don't exist, create them:
1. Go to **Google Cloud Console** → **Secret Manager**
2. Create new secrets with the values from your local `.env`
3. Grant access to the App Hosting service account

---

## 🚀 **SOLUTION 2: Via Firebase CLI**

### **Method 1: Grant Access Command**
```bash
# Try this format (if your CLI supports it)
firebase apphosting:backends:update caf-medroute --env-from-secret NEXT_PUBLIC_FIREBASE_API_KEY

# Or using the newer syntax
firebase apphosting:secrets:access caf-medroute NEXT_PUBLIC_FIREBASE_API_KEY
```

### **Method 2: Recreate Backend**
If the above doesn't work:
```bash
# Delete and recreate backend with proper secret config
firebase apphosting:backends:delete caf-medroute
firebase apphosting:backends:create --location=us-central1
```

---

## 🔍 **VERIFICATION**

After making changes, test the deployment:

### **1. Wait for Deployment**
- New deployment should trigger automatically after backend update
- Check **App Hosting** dashboard for build status

### **2. Test API Endpoints**
```bash
# Test if secrets are now accessible
curl "https://caf-medroute--caf-medroute.us-central1.hosted.app/api/debug-env"

# Should return JSON with hasFirebaseApiKey: true
```

### **3. Test Firebase Auth**
- Open the deployed app in browser
- Check browser console for Firebase auth errors
- Should see no `auth/invalid-api-key` errors

---

## ⚡ **Quick Fix Priority Order**

1. **🥇 Firebase Console**: Most reliable method
2. **🥈 CLI Commands**: If you have the latest Firebase CLI
3. **🥉 Backend Recreate**: Last resort if other methods fail

---

## 🐛 **Common Issues**

### **Secret Doesn't Exist**
```bash
Error: Secret "NEXT_PUBLIC_FIREBASE_API_KEY" not found
```
**Solution**: Create the secret in Google Cloud Secret Manager first

### **Permission Denied**
```bash
Error: Permission denied to access secret
```
**Solution**: Ensure your Firebase project has the necessary IAM permissions

### **CLI Command Not Found**
```bash
Error: apphosting:secrets:access is not a Firebase command
```
**Solution**: Update Firebase CLI or use the console method

---

## 📋 **Next Steps After Fix**

1. ✅ Fix quota issue (already done)
2. ✅ Grant secret access to backend
3. 🔄 Wait for automatic redeployment
4. 🧪 Test API endpoints and Firebase auth
5. 🎉 Confirm production is working!

---

**Note**: The quota fix (maxInstances: 5) has already been deployed. Once secrets are accessible, your app should be fully operational! 