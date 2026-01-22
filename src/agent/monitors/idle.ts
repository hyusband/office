import { execSync } from 'child_process';

export function getIdleMinutes(): number {
    try {
        const psCommand = `
      $lastInput = Add-Type -MemberDefinition @'
        [DllImport("user32.dll")]
        public static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);
        [StructLayout(LayoutKind.Sequential)]
        public struct LASTINPUTINFO {
            public uint cbSize;
            public uint dwTime;
        }
'@ -Name Win32 -PassThru
      $lii = New-Object $lastInput+LASTINPUTINFO
      $lii.cbSize = [System.Runtime.InteropServices.Marshal]::SizeOf($lii)
      if ($lastInput::GetLastInputInfo([ref]$lii)) {
          $idleTime = [Environment]::TickCount - $lii.dwTime
          $idleTime / 1000
      }
    `;

        const seconds = parseFloat(execSync(`powershell -Command "${psCommand.replace(/\n/g, '')}"`, { encoding: 'utf8' }));
        return Math.floor(seconds / 60);
    } catch (err) {
        return 0;
    }
}
