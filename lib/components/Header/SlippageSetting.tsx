import { ChangeEvent, useState } from 'react';
import { useSwapStore } from '../../store/swap.store';
import './SlippageSetting.scss';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';

const SlippageSetting = () => {
    const { t } = useTranslation();

    const { slippage, setSlippage } = useSwapStore();
    const [userInput, setUserInput] = useState(
        slippage === 'auto' ? '' : slippage.toString()
    );

    const handleSlippageChange = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        const decimalRegexp = /^\d*(?:\.\d{0,1})?$/;

        const userInput = e.target.value.replace(/,/g, '.');
        let clearedInput = '';
        if (userInput === '') {
            clearedInput = ''.replace(/^0+$/, '0');
        } else if (userInput === '.' || userInput === '0.') {
            clearedInput = '0.'.replace(/^0+$/, '0');
        } else if (decimalRegexp.test(userInput)) {
            clearedInput = userInput.replace(/^0+$/, '0');
        } else {
            return;
        }
        if (clearedInput.includes('.') || userInput === '0') {
            setUserInput(clearedInput.replace(/^0+(?=\d)/, ''));
        }
        if (Number(clearedInput) > 0 && Number(clearedInput) <= 10) {
            setUserInput(clearedInput.replace(/^0+(?=\d)/, ''));
            setSlippage(+clearedInput);
        } else if (clearedInput === '') {
            setUserInput('');
            setSlippage('auto');
        }
    };

    const handleOnAutoClick = () => {
        setUserInput('');
        setSlippage('auto');
    };
    const handleOnPercentClick = (percent: number) => {
        setUserInput(percent.toString());
        setSlippage(percent);
    };

    return (
        <div
            className="mts-flex mts-flex-col mts-gap-1 md:mts-gap-4 "
            data-testid="slippage-setting"
        >
            <button className="mts-flex  mts-justify-between mts-w-full mts-text-black ">
                <div className="mts-text-lg mts-text-dark-600 dark:mts-text-dark-200">
                    {t('max_slippage')}
                </div>
                <div
                    className="mts-flex mts-justify-center mts-items-center mts-text-sm  mts-text-dark-600 dark:mts-text-dark-200"
                    data-testid="slippage-indicator"
                >
                    {slippage === 'auto' ? t('auto') : `${slippage}%`}{' '}
                </div>
            </button>
            <div className="mts-grid mts-grid-cols-4 mts-justify-around mts-gap-x-2 mts-w-full mts-text-sm md:mts-text-base ">
                <div
                    onClick={handleOnAutoClick}
                    className={cn(
                        `mts-flex mts-relative mts-justify-center mts-items-center mts-transition-all mts-duration-300 mts-cursor-pointer mts-m-[0.125rem] mts-border-[1px] mts-border-transparent mts-rounded-lg mts-bg-white dark:mts-bg-dark-800 dark:mts-text-white mts-p-1 mts-h-12 md:mts-h-12 md:mts-m-1`,
                        slippage === 'auto'
                            ? 'mts-border-primary-500'
                            : 'mts-border-dark-200 dark:mts-border-dark-700'
                    )}
                    data-testid="slippage-setting-auto"
                >
                    {t('auto')}
                </div>
                <div
                    onClick={() => handleOnPercentClick(2)}
                    className={cn(
                        `mts-flex mts-relative mts-justify-center mts-items-center mts-transition-all mts-duration-300 mts-cursor-pointer mts-m-[0.125rem] mts-border-[1px] mts-border-transparent mts-rounded-lg mts-bg-white dark:mts-bg-dark-800 dark:mts-text-white mts-p-1 mts-h-12 md:mts-h-12`,
                        slippage === 2
                            ? 'mts-border-primary-500'
                            : 'mts-border-dark-200 dark:mts-border-dark-700'
                    )}
                    data-testid="slippage-setting-2"
                >
                    2%
                </div>
                <div
                    onClick={() => handleOnPercentClick(5)}
                    className={cn(
                        `mts-flex mts-relative mts-justify-center mts-items-center mts-transition-all mts-duration-300 mts-cursor-pointer mts-m-[0.125rem] mts-border-[1px] mts-border-transparent mts-rounded-lg mts-bg-white dark:mts-bg-dark-800 dark:mts-text-white mts-p-1 mts-h-12 md:mts-h-12`,
                        slippage === 5
                            ? 'mts-border-primary-500'
                            : 'mts-border-dark-200 dark:mts-border-dark-700'
                    )}
                    data-testid="slippage-setting-5"
                >
                    5%
                </div>
                <div
                    className={cn(
                        `mts-flex mts-justify-between mts-items-center mts-gap-1 mts-relative mts-transition-all mts-duration-300 mts-cursor-pointer mts-m-[0.125rem] mts-border-[1px] mts-border-transparent mts-rounded-lg mts-bg-white dark:mts-bg-dark-800 dark:mts-text-white mts-h-12 md:mts-h-12`,
                        ['auto', 2, 5].includes(slippage)
                            ? 'mts-border-dark-200 dark:mts-border-dark-700'
                            : 'mts-border-primary-500'
                    )}
                >
                    <input
                        value={userInput}
                        onChange={handleSlippageChange}
                        data-testid="slippage-setting-input"
                        type="text"
                        dir="rtl"
                        placeholder="1"
                        className="mts-w-full mts-bg-transparent mts-outline-none"
                    />
                    <span className="mts-text-xs md:text-sm mts-pr-1">%</span>
                </div>
            </div>
        </div>
    );
};

export default SlippageSetting;
