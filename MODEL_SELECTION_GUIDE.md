# Model Selection Guide

## ✅ Changes Made

### 1. **Removed Multi-Model Option**
- Removed the "Multi-Model OFF/ON" toggle button
- Removed MultiModelView component
- Simplified the UI to focus on single-model detection
- Cleaner, more focused user experience

### 2. **Easy Model Switching**
Added 5 different models you can test to find the best one for your specific signs:

```typescript
const AVAILABLE_MODELS = [
  { id: 'mysl-dfq0t/1', name: 'MYSL', description: 'Malaysian Sign Language' },
  { id: 'sign-language-3jtnh/1', name: 'Mothana', description: 'General sign language (99% on "me")' },
  { id: 'bim-recognition-x7qsz/11', name: 'BIM v11', description: 'Updated BIM model' },
  { id: 'bim-recognition-x7qsz/10', name: 'BIM v10', description: 'Original BIM model' },
  { id: 'sign-language-kqyow/1', name: 'Mehedi', description: 'Alternative dataset' },
];
```

### 3. **Improved Detection Settings**
- Lowered confidence threshold from 40% to 30%
- Adjusted overlap parameter for better detection
- Added model name to console logs for easier debugging

## 🎯 How to Test Different Models

### Current Selection
**Model Index: 1 (Mothana)** - This model showed 99.74% accuracy on "me" sign in testing

### To Switch Models

Open `frontend/src/app/(landing)/demo/page.tsx` and find this line:

```typescript
const SELECTED_MODEL_INDEX = 1; // Using Mothana model
```

Change the index to test different models:

| Index | Model | Best For | Notes |
|-------|-------|----------|-------|
| **0** | MYSL | Malaysian signs | Good for MAAF (86.93%) |
| **1** | Mothana | General signs | ⭐ 99.74% on "me" |
| **2** | BIM v11 | Updated BIM | Latest version |
| **3** | BIM v10 | Original BIM | Baseline model |
| **4** | Mehedi | Alternative | Different training set |

### Example: Switch to MYSL Model

```typescript
const SELECTED_MODEL_INDEX = 0; // Change from 1 to 0
```

Then refresh your browser!

## 📊 Testing Process

### Step 1: Test Current Model (Mothana)
1. Refresh browser: `http://localhost:3000/demo`
2. Activate Deaf Mode
3. Try your sign language gestures
4. Check console for:
   ```
   🤖 Using model: Mothana - General sign language (99% on "me")
   ✅ Detected: [sign] (XX%) using Mothana
   ```
5. Note which signs are detected accurately

### Step 2: If Accuracy Is Poor, Try MYSL
```typescript
const SELECTED_MODEL_INDEX = 0; // MYSL
```
- Refresh browser
- Test same signs
- Compare accuracy

### Step 3: Try Other Models
Continue testing with indices 2, 3, 4 until you find the best model

### Step 4: Document Your Findings
Keep track of which model works best for which signs:

```
Sign: TOLONG
- MYSL: 85% ✅
- Mothana: Not detected ❌
- BIM v11: 72% ⚠️

Sign: SALAM
- MYSL: 90% ✅
- Mothana: 95% ✅✅ (Best!)
- BIM v11: 65% ⚠️
```

## 🔧 Adjusting Confidence Threshold

If you're getting:
- **Too few detections**: Lower the threshold
- **Too many false positives**: Raise the threshold

### Current Setting
```typescript
const filteredPredictions = predictions.filter(
  (pred: any) => pred.confidence >= 0.3  // 30%
);
```

### To Adjust

**More sensitive (more detections):**
```typescript
pred.confidence >= 0.2  // 20%
```

**More strict (fewer false positives):**
```typescript
pred.confidence >= 0.5  // 50%
```

## 🐛 Debugging

### Console Output

You should see:
```
🤖 Using model: Mothana - General sign language (99% on "me")
📤 Sending frame to Roboflow...
📥 Roboflow response: {...}
✅ Detected: SALAM (85.5%) using Mothana
```

### If No Detection

Check for:
```
⚠️ All predictions below 30% confidence threshold (Mothana)
```
**Solution**: Try a different model or lower confidence threshold

```
⚠️ No predictions from Roboflow (Mothana)
```
**Solution**: Model didn't detect anything - try different model or adjust hand position

### Common Issues

#### Issue: "SAJAS" detected but I'm signing "TOLONG"
**Cause**: Model not trained on your specific sign
**Solution**: Try different models (MYSL, BIM v11, etc.)

#### Issue: No detection at all
**Cause**: Hand not visible or model doesn't recognize gesture
**Solutions**:
1. Ensure hand is clearly visible
2. Try different model
3. Lower confidence threshold to 20%
4. Check lighting

#### Issue: Wrong sign detected consistently
**Cause**: Model trained on different sign language variant
**Solution**: Test all 5 models to find best match

## 📈 Model Performance (From Testing)

Based on previous multi-model testing:

| Model | Strong Signs | Accuracy | Notes |
|-------|-------------|----------|-------|
| **Mothana** | "me" | 99.74% | ⭐ Best for general signs |
| **MYSL** | "MAAF" | 86.93% | Good for Malaysian signs |
| **BIM v11** | Various | Moderate | Updated training |
| **BIM v10** | Various | Moderate | Baseline |
| **Mehedi** | Various | Variable | Alternative dataset |

## 🎯 Recommendation

### For Malaysian Sign Language (BIM):
1. **Start with**: MYSL (index 0)
2. **If poor**: Try Mothana (index 1)
3. **If still poor**: Try BIM v11 (index 2)

### For General Sign Language:
1. **Start with**: Mothana (index 1)
2. **If poor**: Try MYSL (index 0)
3. **If still poor**: Try Mehedi (index 4)

## 🚀 Quick Test Script

Test all models quickly:

1. **Test Mothana (index 1)**: Do 3-5 signs, note accuracy
2. **Test MYSL (index 0)**: Same signs, compare
3. **Test BIM v11 (index 2)**: Same signs, compare
4. **Choose best**: Use the model with highest accuracy

## ✨ Benefits of Single-Model Approach

1. **Simpler UI**: No confusing toggle buttons
2. **Faster**: Only one model call per frame
3. **Easier Testing**: Quick to switch between models
4. **Better Focus**: Find the ONE best model for your needs
5. **Cleaner Code**: Less complexity, easier to maintain

## 📝 Current Configuration

```typescript
// Model selection
const SELECTED_MODEL_INDEX = 1; // Mothana

// Confidence threshold
confidence >= 0.3 // 30%

// API parameters
confidence=30&overlap=30

// Frame capture interval
800ms (1.25 FPS)
```

## 🎓 Understanding Model Training

Different models have different training datasets:

- **MYSL**: Trained on Malaysian Sign Language specifically
- **Mothana**: Trained on general sign language gestures
- **BIM**: Trained on Bahasa Isyarat Malaysia
- **Mehedi**: Trained on alternative sign language dataset

**This is why accuracy varies!** Each model "knows" different signs based on what it was trained on.

## 🔄 Next Steps

1. **Test current model (Mothana)** with your signs
2. **Note accuracy** for each sign
3. **Switch models** if accuracy is poor
4. **Document findings** to remember which model works best
5. **Adjust confidence** if needed
6. **Report back** which model works best for your use case!

---

**The multi-model option has been removed. Now you have a clean, focused interface with easy model switching for testing!** 🎉

**Current Model: Mothana (99.74% accuracy on "me" sign)**

Refresh your browser and test it out! If accuracy isn't good, try switching to MYSL (index 0) or other models.

