#!/bin/bash

echo "Creating Python virtual environment..."
python3 -m venv venv

echo ""
echo "Activating virtual environment..."
source venv/bin/activate

echo ""
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo ""
echo "========================================"
echo "Setup complete!"
echo "========================================"
echo ""
echo "To activate the virtual environment, run:"
echo "  source venv/bin/activate"
echo ""
echo "To test the Roboflow model, run:"
echo "  python test_roboflow.py"
echo ""
echo "To start the FastAPI server, run:"
echo "  uvicorn main:app --reload --port 8000"
echo ""

