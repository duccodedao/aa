export default function formatNumber(
    num: number,
    maxDecimals = 2,
    showLessThan = true
) {
    const number = parseFloat(num.toFixed(maxDecimals));
    if (showLessThan && number < 1 / 10 ** maxDecimals) {
        return `< ${1 / 10 ** maxDecimals}`.toString();
    }
    return number.toString();
}
