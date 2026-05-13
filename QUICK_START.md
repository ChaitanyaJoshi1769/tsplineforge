# TSplineForge Quick Start Guide

## 🚀 Start Here

### Server Status
✅ **Dev server is RUNNING** on http://localhost:3001

### Step 1: Open the Application
```
http://localhost:3001
```

### Step 2: Create an Account or Login
**Option A: Create New Account**
- Click "Sign Up" tab
- Enter email: `test@example.com` (or any email)
- Enter password: `TestPassword123` (or your choice, must be strong)
- Click "Create Account"
- ✅ Auto-redirects to dashboard

**Option B: Use Existing Account**
- Email: `test@example.com`
- Password: `TestPassword123`
- Click "Sign In"
- ✅ Auto-redirects to dashboard

### Step 3: Import a 3D Model
```
1. On Dashboard, click "Import" button (top right)
2. Drag and drop /tmp/test_cube.obj
   OR click "Choose File" and select the file
3. Wait for "Model imported successfully" message
4. Should show: "36 vertices • 12 faces"
```

**Test File**: `/tmp/test_cube.obj`

### Step 4: View in 3D Editor
```
1. After import, view in 3D editor
2. Rotate with mouse (click + drag)
3. Zoom with scroll wheel
4. Pan with spacebar + click
```

### Step 5: Export the Model
```
1. Click "Export" button
2. Choose format (STL, OBJ, GLTF, GLB, STEP, IGES)
3. Click "Export & Download"
4. File downloads
```

---

## ✅ What's Working

- ✅ User authentication (register & login)
- ✅ Dashboard with project list
- ✅ 3D model import (OBJ, STL, GLTF, GLB, PLY, 3MF ready)
- ✅ 3D viewport rendering
- ✅ Model export (multiple formats)
- ✅ Responsive design
- ✅ Professional UI with animations

---

## 🐛 If Something Breaks

### Blank Page?
- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Check browser console: `F12`

### Import Failed?
- Use test file: `/tmp/test_cube.obj`
- Check file format (OBJ, STL, GLTF, GLB, PLY, 3MF)
- Check file size (max 100MB)

### Server Not Running?
```bash
cd /Users/jay/CAD/apps/web
npm run dev
```

---

## 📊 Status

| Component | Status |
|-----------|--------|
| Server | ✅ Running |
| Auth | ✅ Working |
| Import | ✅ Ready |
| Export | ✅ Ready |
| 3D View | ✅ Ready |

---

**Full details**: See `/Users/jay/CAD/PRODUCTION_STATUS.md`
