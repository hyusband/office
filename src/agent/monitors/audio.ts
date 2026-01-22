import { execSync } from 'child_process';

/**
 * Checks if there is any active audio output on Windows.
 */
export function isAudioPlaying(): boolean {
    try {
        const psCommand = `
            Add-Type -TypeDefinition @'
            using System;
            using System.Runtime.InteropServices;
            public class AudioChecker {
                [DllImport("user32.dll")]
                public static extern IntPtr GetForegroundWindow();
            }
'@
            $audioSessions = Get-Process | Where-Object { $_.MainWindowTitle } | ForEach-Object {
                if ( (Get-AudioDevice -Playback).Name ) { return $true }
            }
            # Fallback simpler check: Check for processes known to play audio or use WASAPI
            $isAudio = [Boolean](Get-CimInstance -ClassName Win32_SoundDevice)
            $isAudio
        `;

        
        const simplePs = "(Get-WmiObject -Query 'select * from Win32_PerfFormattedData_PerfOS_Processor where Name=\"_Total\"').PercentProcessorTime -gt 0";
        const audioCmd = 'powershell -Command "Get-CimInstance -ClassName Win32_SoundDevice | Select-Object -Property Status"';
        const res = execSync(audioCmd, { encoding: 'utf8' });

        const sleepCmd = 'powercfg /requests';
        const powerRequests = execSync(sleepCmd, { encoding: 'utf8' });

        return powerRequests.includes('DISPLAY:') || powerRequests.includes('SYSTEM:') || powerRequests.includes('AWAYMODE:');
    } catch (err) {
        return false;
    }
}
