# validation_script.py
"""
This script creates and saves a proof of validation (PoR) for a model implementation.
Workflow:
1. Loads or creates a PoRGenerator instance for the specified model ("depth_anything_v2" in this example).
2. Executes a target script ("model_script.py") as a subprocess, monitoring and saving execution information in the format of a json file.
3. Add and save validation tests comparing claimed results from the original paper to the user's results, including accuracy and inference speed.
    3.1 Validation test must be included by the user.
Modules:
- por_generator: Provides PoRGenerator for monitoring and validation.
- subprocess, sys: Used to execute and manage the target script.
Usage:
    * Run this script to generate and save PoR.
    * Each phase can be run independently, allowing for flexible validation workflows.
    * In the expected flow, this script would be executed after the user has run the target script and obtained results.
"""

from por_generator import PoRGenerator
import subprocess
import sys

# Load existing generator or create new one
por = PoRGenerator("depth_anything_v2")
script_path = "model_script.py"

################ PHASE 1: Execute the script and monitor ################
# Phase 1 outputs are saved and signed automatically

with por.monitor_and_save_execution_info(script_path) as monitor:
    # Execute the script as subprocess
    result = subprocess.run(
        [
            sys.executable,  # Use the current Python interpreter
            script_path,  # Path to the script
        ],
        cwd="./",  # Set working directory
        capture_output=True,  # Capture stdout/stderr
        text=True,  # Decode output as text
    )

################ PHASE 2: Add validation tests ################

# Add multiple validation tests
por.add_validation_test(
    test_name="depth_accuracy",
    paper_claims="RMSE: 0.059 on NYU Depth v2",
    my_result="RMSE: 0.061 on NYU Depth v2",
    matches=True,
    notes="Within acceptable tolerance",
)

por.add_validation_test(
    test_name="inference_speed",
    paper_claims="30 FPS on RTX 3090",
    my_result="28 FPS on RTX 5070",
    matches=True,
    notes="Different GPU but comparable",
)

# Save validation proof
por.save_validation_proof()
print("Validation proof saved.")
