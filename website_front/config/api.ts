const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');
const withApiPrefix = (value: string): string => {
    const trimmed = trimTrailingSlash(value);

    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

export const API = withApiPrefix(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api');
export const LOADER_API = trimTrailingSlash(process.env.NEXT_PUBLIC_LOADER_API || 'http://localhost:5000');
export const REF_LINK = process.env.NEXT_PUBLIC_REF_LINK || 'http://localhost:3000/ref/';

const DISCORD_CLIENT_ID = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '1210284774263099482';
const DISCORD_REDIRECT_URI = isProduction
    ? 'https://api.fomo.cx/api/discord'
    : 'http://localhost:5000/api/discord';

export const DISCORD_LINK = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&scope=identify`;

export const TELEGRAM_LINK = process.env.NEXT_PUBLIC_TELEGRAM_BOT_LINK || 'https://t.me/fomolandbot';

export const SERVER_CONFIG = {
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:5000',
    DISCORD_REDIRECT_URI: process.env.DISCORD_REDIRECT_URI || 'http://localhost:5000/api/discord',
} as const;

