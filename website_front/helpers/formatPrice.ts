export function formatPrice(price: string | number, decimals = 8): string {
    const num = Number(price);

    if (!isFinite(num) || num === 0) return "0";

    if (Math.abs(num) < 1e-6) {
        return num.toExponential(2);
    }

    if (num < 1) {
        return num.toFixed(decimals).replace(/0+$/, "").replace(/\.$/, "");
    }

    return num.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: decimals,
    });
}
