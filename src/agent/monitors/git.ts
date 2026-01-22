import { execSync } from 'child_process';

export function getGitBranch(): string | undefined {
    try {
        const branch = execSync('git rev-parse --abbrev-ref HEAD', {
            stdio: ['ignore', 'pipe', 'ignore'],
            timeout: 1000
        }).toString().trim();

        return branch !== 'HEAD' ? branch : undefined;
    } catch (err) {
        return undefined;
    }
}
