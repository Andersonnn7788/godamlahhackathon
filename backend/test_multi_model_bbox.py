"""
Test script for multi-model detector with bounding box visualization
"""
import os
from multi_model_detector import MultiModelDetector
from dotenv import load_dotenv

load_dotenv()

def test_multi_model_detector():
    print("=" * 70)
    print("Testing Multi-Model Sign Language Detector with Bounding Boxes")
    print("=" * 70)
    
    # Initialize detector
    detector = MultiModelDetector()
    
    # Get model info
    model_info = detector.get_model_info()
    print(f"\n✅ Initialized with {model_info['total_models']} models:")
    for name, info in model_info['models'].items():
        print(f"   - {name}: {info['model_id']}")
    
    # Load test image
    test_image_path = "test.jpg"
    if not os.path.exists(test_image_path):
        print(f"\n❌ Test image not found: {test_image_path}")
        print("   Please add a test.jpg file with a hand sign")
        return
    
    with open(test_image_path, "rb") as f:
        image_data = f.read()
    
    print(f"\n✅ Loaded test image: {test_image_path} ({len(image_data)} bytes)")
    
    # Run detection
    print("\n🔍 Running multi-model detection...")
    print("-" * 70)
    
    result = detector.detect_all_models(image_data)
    
    if result.get("success"):
        print("\n✅ Multi-model detection successful!")
        print(f"   Total models: {result.get('total_models', 0)}")
        print(f"   Models with detections: {result.get('models_with_detections', 0)}")
        
        # Show best overall
        best_overall = result.get("best_overall")
        if best_overall:
            print(f"\n🏆 Best Overall Detection:")
            print(f"   Model: {best_overall['model']}")
            print(f"   Class: {best_overall['prediction'].get('class')}")
            print(f"   Confidence: {best_overall['confidence']:.2%}")
        
        # Show individual model results
        print(f"\n📊 Individual Model Results:")
        print("-" * 70)
        
        models = result.get("models", {})
        for model_name, model_data in models.items():
            print(f"\n{model_name}:")
            if model_data.get("bbox_count", 0) > 0:
                best_pred = model_data.get("best_prediction")
                print(f"   ✅ {model_data['bbox_count']} detection(s)")
                print(f"   Best: {best_pred['class']} ({best_pred['confidence']:.2%})")
                print(f"   Position: ({best_pred['x']}, {best_pred['y']})")
                print(f"   Size: {best_pred['width']}x{best_pred['height']}")
            elif model_data.get("error"):
                print(f"   ❌ Error: {model_data['error']}")
            else:
                print(f"   ⚠️  No detections")
        
        # Save annotated image
        if result.get("annotated_image"):
            print(f"\n💾 Saving annotated image...")
            import base64
            
            # Extract base64 data
            image_base64 = result["annotated_image"].split(",")[1]
            image_bytes = base64.b64decode(image_base64)
            
            output_path = "test_annotated.jpg"
            with open(output_path, "wb") as f:
                f.write(image_bytes)
            
            print(f"   ✅ Saved to: {output_path}")
            print(f"   Open this file to see bounding boxes from all models!")
        
        print("\n" + "=" * 70)
        print("🎉 Multi-model detection test complete!")
        print("=" * 70)
        
    else:
        print(f"\n❌ Multi-model detection failed:")
        print(f"   Error: {result.get('error', 'Unknown error')}")

if __name__ == "__main__":
    test_multi_model_detector()

