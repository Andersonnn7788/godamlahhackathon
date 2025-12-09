"""
Test script for Roboflow BIM Sign Language Recognition
"""
from inference_sdk import InferenceHTTPClient
import json

# Initialize the Roboflow client
CLIENT = InferenceHTTPClient(
    api_url="https://detect.roboflow.com",
    api_key="PfNLBY9FSfXGfx9lccYk"
)

def test_inference():
    """Test the Roboflow model with test.jpg"""
    print("Testing Roboflow BIM Sign Language Recognition...")
    print("-" * 50)
    
    try:
        # Run inference on test image
        result = CLIENT.infer("test.jpg", model_id="bim-recognition-x7qsz/10")
        
        # Pretty print the result
        print("\n✅ Inference successful!")
        print("\nFull Result:")
        print(json.dumps(result, indent=2))
        
        # Extract predictions if available
        if "predictions" in result and result["predictions"]:
            print("\n" + "=" * 50)
            print("PREDICTIONS:")
            print("=" * 50)
            for i, pred in enumerate(result["predictions"], 1):
                print(f"\nPrediction {i}:")
                print(f"  Class: {pred.get('class', 'N/A')}")
                print(f"  Confidence: {pred.get('confidence', 0):.2%}")
                if 'x' in pred and 'y' in pred:
                    print(f"  Position: ({pred['x']:.1f}, {pred['y']:.1f})")
                if 'width' in pred and 'height' in pred:
                    print(f"  Size: {pred['width']:.1f}x{pred['height']:.1f}")
        else:
            print("\n⚠️  No predictions found in the result")
            
    except FileNotFoundError:
        print("❌ Error: test.jpg not found in the current directory")
        print("   Please make sure test.jpg exists in the backend folder")
    except Exception as e:
        print(f"❌ Error during inference: {str(e)}")
        print(f"   Error type: {type(e).__name__}")

if __name__ == "__main__":
    test_inference()


