"""
Test script for multiple Roboflow BIM Sign Language Recognition models
"""
from inference_sdk import InferenceHTTPClient
import json

# Initialize the Roboflow client
CLIENT = InferenceHTTPClient(
    api_url="https://detect.roboflow.com",
    api_key="PfNLBY9FSfXGfx9lccYk"
)

# Multiple models
MODELS = {
    "BIM Recognition v10": "bim-recognition-x7qsz/10",
    "MYSL Model": "mysl-dfq0t/1",
    "Sign Language (Mothana)": "sign-language-3jtnh/1",
    "Sign Language (Mehedi)": "sign-language-kqyow/1",
    "Sign Language Detection (Chandana)": "sign-language-detection-nygkw/2",
}

def test_model(model_name, model_id):
    """Test a single model"""
    print(f"\n{'='*60}")
    print(f"Testing: {model_name}")
    print(f"Model ID: {model_id}")
    print('='*60)
    
    try:
        result = CLIENT.infer("test.jpg", model_id=model_id)
        
        if "predictions" in result and result["predictions"]:
            print(f"✅ Success! Found {len(result['predictions'])} prediction(s)")
            
            for i, pred in enumerate(result["predictions"], 1):
                print(f"\n  Prediction {i}:")
                print(f"    Class: {pred.get('class', 'N/A')}")
                print(f"    Confidence: {pred.get('confidence', 0):.2%}")
                if 'x' in pred and 'y' in pred:
                    print(f"    Position: ({pred['x']:.1f}, {pred['y']:.1f})")
                if 'width' in pred and 'height' in pred:
                    print(f"    Size: {pred['width']:.1f}x{pred['height']:.1f}")
        else:
            print("⚠️  No predictions found")
            
        return result
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None

def compare_models():
    """Compare results from all models"""
    print("\n" + "="*60)
    print("COMPARING ALL MODELS")
    print("="*60)
    
    results = {}
    
    for model_name, model_id in MODELS.items():
        result = test_model(model_name, model_id)
        if result and "predictions" in result and result["predictions"]:
            best_pred = max(result["predictions"], key=lambda x: x.get("confidence", 0))
            results[model_name] = {
                "class": best_pred.get("class"),
                "confidence": best_pred.get("confidence", 0),
                "total_predictions": len(result["predictions"])
            }
    
    if results:
        print("\n" + "="*60)
        print("SUMMARY")
        print("="*60)
        
        for model_name, data in results.items():
            print(f"\n{model_name}:")
            print(f"  Best Class: {data['class']}")
            print(f"  Confidence: {data['confidence']:.2%}")
            print(f"  Total Predictions: {data['total_predictions']}")
        
        # Find best overall
        best_model = max(results.items(), key=lambda x: x[1]["confidence"])
        print(f"\n🏆 Best Model: {best_model[0]}")
        print(f"   Class: {best_model[1]['class']}")
        print(f"   Confidence: {best_model[1]['confidence']:.2%}")

if __name__ == "__main__":
    print("Testing Multiple Roboflow BIM Sign Language Recognition Models")
    print("-" * 60)
    
    try:
        compare_models()
    except FileNotFoundError:
        print("\n❌ Error: test.jpg not found in the current directory")
        print("   Please make sure test.jpg exists in the backend folder")
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")

