import { execSync } from 'child_process';

/**
 * Checks if the webcam is currently in use on Windows.
 */
export function isCameraInUse(): boolean {
    try {
        const psCommand = `
            $WebcamUsage = Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\webcam\\*" -ErrorAction SilentlyContinue
            $InUse = $false
            foreach ($app in $WebcamUsage) {
                if ($app.LastUsedTimeStop -eq 0) {
                    $InUse = $true
                    break
                }
            }
            if (-not $InUse) {
                $NonPackaged = Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\webcam\\NonPackaged\\*" -ErrorAction SilentlyContinue
                foreach ($app in $NonPackaged) {
                    if ($app.LastUsedTimeStop -eq 0) {
                        $InUse = $true
                        break
                    }
                }
            }
            $InUse
        `;
        const result = execSync(`powershell -Command "${psCommand.replace(/\n/g, '')}"`, { encoding: 'utf8' }).trim();
        return result === 'True';
    } catch (err) {
        return false;
    }
}
