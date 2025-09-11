import sys
import datetime
import os
import platform
import psutil
import subprocess
from contextlib import contextmanager
import traceback
import multiprocessing
import time
import GPUtil
import tempfile
from eth_account import Account
from eth_account.messages import encode_defunct
import json
import hashlib
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()


class PoRGenerator:
    def __init__(self, project_id):
        self.project_id = project_id
        self.execution_logs = []
        self.validation_tests = []
        self.start_time = None
        self.original_stdout = sys.stdout
        self.original_stderr = sys.stderr
        self.eth_private_key = os.getenv("ETH_PRIVATE_KEY")
        if self.eth_private_key is None:
            raise ValueError("\033[93mWarning: ETH_PRIVATE_KEY not set. Logs will not be signed.\033[0m")

    def capture_environment(self, script_path: str = None) -> Dict[str, Any]:
        """Environment snapshot"""
        if script_path and not os.path.exists(script_path):
            raise FileNotFoundError(f"Script path {script_path} does not exist.")

        env_info = {
            "timestamp": int(datetime.datetime.now().timestamp()),
            "platform": platform.platform(),
            "python_version": sys.version,
            "python_executable": sys.executable,
            "working_directory": os.getcwd(),
            # Package versions (more robust)
            "package_environment": self._get_package_versions(),
            "git_info": self._get_git_info(),
            "script_info": self._get_script_content_hash(script_path) if script_path else None,
            # Hardware
            "Hardware": {
                "gpu_info": self._get_gpu_info(),
                "cuda_version": self._get_cuda_version(),
                "cpu_info": platform.processor(),
                "cpu_count": os.cpu_count(),
                "memory_gb": psutil.virtual_memory().total // (1024**3),
            },
        }

        return env_info

    def _get_package_versions(self):
        """Get requirements.txt package versions"""
        requirements_path = os.path.join(os.getcwd(), "requirements.txt")
        if not os.path.exists(requirements_path):
            raise FileNotFoundError("requirements.txt not found in the current directory, PoR generation not possible without it.")

        with open(requirements_path, "r") as f:
            lines = f.readlines()

        packages = {}
        for line in lines:
            line = line.strip()
            if line and not line.startswith("#"):
                pkg_name, _, pkg_version = line.partition("==")
                packages[pkg_name] = pkg_version

        return packages

    def _get_git_info(self):
        """Get git repository information"""
        try:
            git_info = {}

            # Get commit hash
            git_info["commit_hash"] = subprocess.check_output(["git", "rev-parse", "HEAD"]).decode().strip()

            # Get current branch
            git_info["branch"] = subprocess.check_output(["git", "branch", "--show-current"]).decode().strip()
            # Get remote URL
            git_info["remote_url"] = subprocess.check_output(["git", "config", "--get", "remote.origin.url"]).decode().strip()

            return git_info

        except subprocess.CalledProcessError:
            # Not a git repository or git not available
            return {"error": "Not a git repository or git not available"}
        except FileNotFoundError:
            # Git command not found
            return {"error": "Git not installed"}
        except Exception as e:
            return {"error": f"Failed to get git info: {str(e)}"}

    def _get_gpu_info(self):
        """Get GPU information using nvidia-smi"""
        try:
            gpu_info = (
                subprocess.check_output(
                    [
                        "nvidia-smi",
                        "--query-gpu=name,memory.total,driver_version",
                        "--format=csv,noheader",
                    ]
                )
                .decode()
                .strip()
                .split("\n")
            )
            gpus = []
            for gpu in gpu_info:
                name, memory, driver = [x.strip() for x in gpu.split(",")]
                gpus.append({"name": name, "memory": memory, "driver_version": driver})
            return gpus
        except subprocess.CalledProcessError:
            return "nvidia-smi command failed"
        except FileNotFoundError:
            return "nvidia-smi not found"
        except Exception as e:
            return f"Failed to get GPU info: {str(e)}"

    def _get_cuda_version(self):
        """Get CUDA version using nvcc"""
        try:
            cuda_version = subprocess.check_output(["nvcc", "--version"]).decode().strip()
            for line in cuda_version.split("\n"):
                if "Cuda compilation tools, release" in line:
                    parts = line.split("release")
                    if len(parts) > 1:
                        version = parts[1].split(",")[0].strip()
                        return version
            return "Unknown CUDA version"
        except subprocess.CalledProcessError:
            return "nvcc command failed"
        except FileNotFoundError:
            return "nvcc not found"
        except Exception as e:
            return f"Failed to get CUDA version: {str(e)}"

    def _get_script_content_hash(self, script_path):
        """Get SHA-256 hash of the script content"""
        try:
            with open(script_path, "rb") as f:
                content = f.read()
            return {
                "content_sha256": hashlib.sha256(content).hexdigest(),
                "file_size_bytes": len(content),
            }
        except Exception as e:
            return {"error": f"Failed to hash script: {str(e)}"}

    @contextmanager
    def monitor_and_save_execution_info(self, entry_point):
        self.start_time = int(datetime.datetime.now().timestamp())

        initial_state = {
            "timestamp": self.start_time,
            "entry_point": entry_point,
            "environment": self.capture_environment(entry_point),
        }

        monitor_process = None
        stdout_file = stderr_file = None
        exception_info = None

        try:
            monitor_process = self._start_resource_monitor()

            with self._capture_output() as (stdout_file, stderr_file):
                yield self

        except Exception as e:
            exception_info = {
                "exception_type": type(e).__name__,
                "exception_message": str(e),
                "traceback": traceback.format_exc(),
            }
            raise

        finally:
            if monitor_process:
                try:
                    monitor_process.terminate()
                    monitor_process.wait(timeout=5)
                except Exception:
                    monitor_process.kill()

            # Capture final state including any exception info
            final_state = {
                "end_time": int(datetime.datetime.now().timestamp()),
                "execution_time": (int(datetime.datetime.now().timestamp()) - self.start_time) / 1000,
                "exception_info": exception_info,
            }

            self._finalize_logs(stdout_file, stderr_file, initial_state, final_state)
            self.save_proof(self.execution_logs[-1], proof_phase="phase_1")

    def _start_resource_monitor(self):
        """Start background process to monitor CPU, memory, and GPU usage"""

        def monitor_worker(result_queue, stop_event, interval=1.0):
            """Worker process that monitors resources"""

            while not stop_event.is_set():
                try:
                    # CPU and memory
                    cpu_percent = psutil.cpu_percent(interval=0.1)
                    memory = psutil.virtual_memory()

                    # GPU info
                    gpu_info = []
                    if GPUtil:
                        try:
                            gpus = GPUtil.getGPUs()
                            gpu_info = [
                                {
                                    "id": gpu.id,
                                    "name": gpu.name,
                                    "memory_used": gpu.memoryUsed,
                                    "memory_total": gpu.memoryTotal,
                                    "memory_percent": gpu.memoryUtil * 100,
                                    "gpu_util": gpu.load * 100,
                                    "temperature": gpu.temperature,
                                }
                                for gpu in gpus
                            ]
                        except Exception:
                            pass

                    resource_snapshot = {
                        "timestamp": int(datetime.datetime.now().timestamp()),
                        "cpu_percent": cpu_percent,
                        "memory_used_gb": memory.used / (1024**3),
                        "memory_percent": memory.percent,
                        "gpu_info": gpu_info,
                    }

                    result_queue.put(resource_snapshot)
                    time.sleep(interval)

                except Exception as e:
                    # Log error but continue monitoring
                    result_queue.put({"error": str(e)})
                    time.sleep(interval)

        # Create shared objects
        self.resource_queue = multiprocessing.Queue()
        self.stop_monitoring = multiprocessing.Event()

        # Start monitoring process
        monitor_process = multiprocessing.Process(target=monitor_worker, args=(self.resource_queue, self.stop_monitoring))
        monitor_process.start()
        return monitor_process

    def _capture_output(self):
        """Context manager to capture stdout/stderr"""

        @contextmanager
        def capture():
            stdout_file = tempfile.NamedTemporaryFile(mode="w+", delete=False)
            stderr_file = tempfile.NamedTemporaryFile(mode="w+", delete=False)

            # Redirect stdout/stderr
            original_stdout = sys.stdout
            original_stderr = sys.stderr

            try:
                sys.stdout = stdout_file
                sys.stderr = stderr_file
                yield stdout_file, stderr_file
            finally:
                # Restore original stdout/stderr
                sys.stdout = original_stdout
                sys.stderr = original_stderr
                stdout_file.close()
                stderr_file.close()

        return capture()

    def _finalize_logs(self, stdout_file, stderr_file, initial_state, final_state=None):
        """Finalize logs and collect resource monitoring data"""

        # Stop resource monitoring
        if hasattr(self, "stop_monitoring"):
            self.stop_monitoring.set()

        # Collect all resource snapshots
        resource_history = []
        if hasattr(self, "resource_queue"):
            try:
                while not self.resource_queue.empty():
                    resource_history.append(self.resource_queue.get_nowait())
            except Exception:
                pass

        # Read captured output
        stdout_content = ""
        stderr_content = ""

        if stdout_file:
            try:
                with open(stdout_file.name, "r") as f:
                    stdout_content = f.read()
                os.unlink(stdout_file.name)  # Clean up temp file
            except Exception:
                pass

        if stderr_file:
            try:
                with open(stderr_file.name, "r") as f:
                    stderr_content = f.read()
                os.unlink(stderr_file.name)  # Clean up temp file
            except Exception:
                pass

        # Save everything
        log_entry = {
            "project_id": self.project_id,
            "initial_state": initial_state,
            "final_state": final_state,
            "resource_history": resource_history,
            "stdout": stdout_content,
            "stderr": stderr_content,
        }

        self.execution_logs.append(log_entry)

    def _sign_proof(self, proof_data):
        """Sign the complete proof"""

        proof_str = json.dumps(proof_data, sort_keys=True, default=str)
        proof_hash = hashlib.sha256(proof_str.encode()).hexdigest()

        account = Account.from_key(self.eth_private_key)
        message = encode_defunct(text=proof_hash)
        signature = account.sign_message(message)

        return {
            "proof_data": proof_data,
            "cryptographic_signature": {
                "content_hash": proof_hash,
                "signature": signature.signature.hex(),
                "signer_address": account.address,
                "signed_at": int(datetime.datetime.now().timestamp()),
                "algorithm": "ethereum_ecdsa",
            },
        }

    def save_proof(self, proof, proof_phase="phase_1") -> str:
        """Save complete proof to file"""
        filename = f"PoR_{proof_phase}_{self.project_id}_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        if self.eth_private_key is None:
            raise ValueError("ETH_PRIVATE_KEY not set. Cannot sign the proof.")

        signed_proof = self._sign_proof(proof)
        with open(filename, "w") as f:
            json.dump(signed_proof, f, indent=2, default=str)
        print(f"Signed complete proof saved: {filename}")

        return filename

    def add_validation_test(self, test_name: str, paper_claims: str, my_result: str, matches: bool, notes: str = ""):
        """Add a validation test result"""
        test = {
            "test_name": test_name,
            "paper_claims": paper_claims,
            "my_result": my_result,
            "matches": matches,
            "notes": notes,
            "tested_at": datetime.datetime.now().timestamp(),
        }

        self.validation_tests.append(test)
        print(f"Added validation test: {test_name} - {'PASS' if matches else 'FAIL'}")
        return test

    def save_validation_proof(self):
        """Save validation tests as separate signed log"""
        validation_data = {
            "project_id": self.project_id,
            "phase": "validation",
            "created_at": datetime.datetime.now().timestamp(),
            "tests": self.validation_tests,
            "summary": {
                "total_tests": len(self.validation_tests),
                "passed_tests": sum(1 for t in self.validation_tests if t["matches"]),
                "overall_pass": all(t["matches"] for t in self.validation_tests),
            },
        }

        filename = f"PoR_phase_2_{self.project_id}_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

        if self.eth_private_key:
            signed_entry = self._sign_proof(validation_data)
            with open(filename, "w") as f:
                json.dump(signed_entry, f, indent=2, default=str)
        else:
            with open(filename, "w") as f:
                json.dump(validation_data, f, indent=2, default=str)

        print(f"Validation proof saved to {filename}")
        return filename

    def add_and_save_validation_test(self, test_name: str, paper_claims: str, my_result: str, matches: bool, notes: str = ""):
        """Add a validation test and immediately save the proof"""
        self.add_validation_test(test_name, paper_claims, my_result, matches, notes)
        self.save_validation_proof()


if __name__ == "__main__":
    # get script path from command line argument
    if len(sys.argv) < 2:
        print("Usage: python por_generator.py <script_path>")
        sys.exit(1)
    script_path = sys.argv[1]

    por_gen = PoRGenerator(project_id=script_path)
    with por_gen.monitor_and_save_execution_info(script_path) as monitor:
        # Execute the script as subprocess
        result = subprocess.run(
            [
                sys.executable,  # Use same Python interpreter
                script_path,
            ],
            cwd="./",  # Set working directory
            capture_output=True,  # Capture stdout/stderr
            text=True,
        )
        if result.returncode != 0:
            print(f"\033[91mScript exited with errors:\n{result.stderr}\033[0m")
        else:
            print(f"\033[92mScript executed successfully:\n{result.stdout}\033[0m")
