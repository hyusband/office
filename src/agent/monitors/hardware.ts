import { execSync } from 'child_process';

export interface HardwareInfo {
    battery?: number;
    isCharging?: boolean;
    cpuLoad?: number;
}

export function getHardwareInfo(): HardwareInfo {
    const info: HardwareInfo = {};

    try {
        const batteryPs = `
            $battery = Get-CimInstance -ClassName Win32_Battery
            if ($battery) {
                "$($battery.EstimatedChargeRemaining),$($battery.BatteryStatus)"
            }
        `;
        const batteryResult = execSync(`powershell -Command "${batteryPs.replace(/\n/g, '')}"`, { encoding: 'utf8' }).trim();
        if (batteryResult) {
            const [percent, status] = batteryResult.split(',');
            info.battery = parseInt(percent);
            info.isCharging = status === '2' || status === '6' || status === '7';
        }

        const cpuPs = "(Get-CimInstance Win32_Processor).LoadPercentage";
        const cpuResult = execSync(`powershell -Command "${cpuPs}"`, { encoding: 'utf8' }).trim();
        if (cpuResult) {
            info.cpuLoad = parseInt(cpuResult);
        }
    } catch (err) {
        // Fail silently
    }

    return info;
}