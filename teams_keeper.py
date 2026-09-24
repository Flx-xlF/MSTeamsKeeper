import subprocess
import time
import sys
from datetime import datetime

def run_applescript(script_content):
    """
    Executes an AppleScript command using osascript.
    """
    try:
        # Determine the browser application name
        # The user specified Edge.
        proc = subprocess.run(
            ['osascript', '-e', script_content],
            capture_output=True,
            text=True
        )
        return proc.stdout.strip(), proc.stderr.strip()
    except Exception as e:
        return None, str(e)

APPLESCRIPT_TEMPLATE = """
tell application "Microsoft Edge"
    set teamsFound to false
    repeat with w in windows
        repeat with t in tabs of w
            if URL of t contains "teams.microsoft.com" then
                set teamsFound to true
                -- Simulate a mouse move event
                execute t javascript "
                    var event = new MouseEvent('mousemove', {
                        'view': window,
                        'bubbles': true,
                        'cancelable': true
                    });
                    document.body.dispatchEvent(event);
                    
                    // Also simulate a key press (Shift) just in case
                    var keyEvent = new KeyboardEvent('keydown', {
                        'key': 'Shift',
                        'code': 'ShiftLeft',
                        'keyCode': 16,
                        'charCode': 0,
                        'bubbles': true
                    });
                    document.body.dispatchEvent(keyEvent);
                    
                    var keyUpEvent = new KeyboardEvent('keyup', {
                        'key': 'Shift',
                        'code': 'ShiftLeft',
                        'keyCode': 16,
                        'charCode': 0,
                        'bubbles': true
                    });
                    document.body.dispatchEvent(keyUpEvent);
                "
                return "Simulated activity in Teams tab."
            end if
        end repeat
    end repeat
    if teamsFound is false then
        return "Teams tab not found."
    end if
end tell
"""

def main():
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Starting MSTeamsKeeper...")
    print("Ensure Microsoft Edge is running and you have a tab open with 'teams.microsoft.com'.")
    print("Press Ctrl+C to stop.")

    while True:
        try:
            timestamp = datetime.now().strftime('%H:%M:%S')
            stdout, stderr = run_applescript(APPLESCRIPT_TEMPLATE)
            
            if stderr:
                # Often 'Application isn't running' or permission error
                if "Application isn" in stderr:
                     print(f"[{timestamp}] Microsoft Edge is not running.")
                else:
                    print(f"[{timestamp}] AppleScript Error: {stderr}")
            else:
                if "Teams tab not found" in stdout:
                     print(f"[{timestamp}] Teams tab not found. Is it open?")
                else:
                     print(f"[{timestamp}] {stdout}")
            
            # Wait for 60 seconds before next ping
            # Teams usually goes idle after 5 minutes, so 1 minute is safe.
            time.sleep(60)
            
        except KeyboardInterrupt:
            print("\nStopping script.")
            sys.exit(0)
        except Exception as e:
            print(f"Error: {e}")
            time.sleep(60)

if __name__ == "__main__":
    main()
