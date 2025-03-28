import { create } from 'zustand';
import { Asset, BestRoute, Dex, MyTonSwapClient, Prices } from '@mytonswap/sdk';
import { toNano } from '@mytonswap/sdk';
import { useOptionsStore } from './options.store';
import catchError from '../utils/catchErrors';
import { WIDGET_VERSION } from '../constants';
import { reportErrorWithToast } from '../services/errorAnalytics';
import { useEventsStore } from './events.store';
import { useWalletStore } from './wallet.store';

export enum ModalState {
    NONE = 'NONE',
    WAITING = 'WAITING',
    ACCEPTED = 'ACCEPTED',
    IN_PROGRESS = 'IN_PROGRESS',
    DONE = 'DONE',
    ERROR = 'ERROR',
    CONFIRM = 'CONFIRM',
}

type SwapStates = {
    client: MyTonSwapClient;
    pay_token: Asset | null;
    receive_token: Asset | null;
    pay_rate: Prices | null;
    receive_rate: Prices | null;
    pay_amount: bigint;
    assets: Asset[] | null;
    isLoading: boolean;
    isSelectingToken: boolean;
    isFindingBestRoute: boolean;
    bestRoute: BestRoute | null;
    onePayRoute: BestRoute | null;
    slippage: 'auto' | number;
    communityTokens: boolean;
    acceptedCommunityToken: string[];
    swapModal: ModalState;
    transactionError: string | null;
    transactionErrorBody: string | null;
    transactionHash: string | null;
    transactionQueryId: string | null;
    pinnedTokens: Asset[] | null;
    refetchInterval: ReturnType<typeof setInterval> | null;
};

type SwapActions = {
    setPayToken: (token: Asset) => Promise<void>;
    setReceiveToken: (token: Asset) => Promise<void>;
    initializeApp: () => void;
    setIsLoading: (isLoading: boolean) => void;
    addToAssets: (assets: Asset[]) => void;
    setPayAmount: (amount: bigint) => Promise<void>;
    setSlippage: (slippage: 'auto' | number) => void;
    setCommunityTokens: (state: boolean) => void;
    addToken: (token: string) => void;
    removeToken: (token: string) => void;
    isInAgreedTokens: (token: string) => boolean;
    changeDirection: () => void;
    setModalState: (state: ModalState) => void;
    setErrorMessage: ({
        errorMessage,
        errorTitle,
    }: {
        errorMessage: string | null;
        errorTitle: string | null;
    }) => void;
    setTransactionHash: (hash: string, query_id: string) => void;

    refetchBestRoute: () => void;
};

export const useSwapStore = create<SwapActions & SwapStates>((set, get) => ({
    client: new MyTonSwapClient({
        headers: {
            'widget-version': WIDGET_VERSION,
        },
    }),
    refetchInterval: null,
    pay_token: null,
    pay_rate: null,
    pay_amount: 0n,
    receive_token: null,
    receive_rate: null,
    isLoading: true,
    isSelectingToken: false,
    isFindingBestRoute: false,
    bestRoute: null,
    onePayRoute: null,
    slippage: 'auto',
    communityTokens: localStorage.getItem('mts_widget_ct') === 'true',
    acceptedCommunityToken: JSON.parse(
        localStorage.getItem('mts_widget_act') ?? '[]'
    ),
    swapModal: ModalState.NONE,
    transactionError: null,
    transactionErrorBody: null,
    transactionHash: null,
    transactionQueryId: null,
    transactionBestRoute: null,
    pinnedTokens: null,
    assets: null,

    setTransactionHash(hash, query_id) {
        const {
            pay_token,
            receive_token,
            bestRoute,
            pay_amount,
            pay_rate,
            receive_rate,
        } = get();

        set(() => ({
            transactionHash: hash,
            transactionQueryId: query_id,
            swapModal: ModalState.IN_PROGRESS,
        }));
        useEventsStore.getState().onSwap({
            type: 'start',
            data: {
                pay: pay_token!,
                receive: receive_token!,
                pay_amount: pay_amount.toString(),
                receive_amount: bestRoute?.pool_data.receive.toString() ?? '0',
                pay_rate: pay_rate?.USD ?? 0,
                receive_rate: receive_rate?.USD ?? 0,
                dex: bestRoute!.selected_pool.dex as Dex,
                hash,
            },
        });
    },

    setErrorMessage({ errorMessage, errorTitle }) {
        set(() => ({
            transactionError: errorTitle,
            transactionErrorBody: errorMessage,
            swapModal: ModalState.ERROR,
        }));
    },
    setModalState(state) {
        set(() => ({ swapModal: state }));
    },
    async changeDirection() {
        const {
            receive_token,
            receive_rate,
            pay_token,
            pay_rate,
            client,
            slippage,
        } = get();
        if (!receive_token || !pay_token) return;
        useEventsStore
            .getState()
            .onTokenSelect({ type: 'pay', asset: receive_token });
        set(() => ({
            pay_token: receive_token,
            pay_rate: receive_rate,
            pay_amount: 0n,
            receive_token: pay_token,
            receive_rate: pay_rate,
            bestRoute: null,
        }));
        const bestRouteResult = await catchError(() =>
            client.router.findBestRoute(
                pay_token.address,
                receive_token.address,
                0n,
                slippage === 'auto' ? undefined : slippage
            )
        );
        if (bestRouteResult.error) {
            reportErrorWithToast(
                bestRouteResult.error,
                'Failed to get best route',
                'swap.store.ts setPayAmount findBestRoute :196'
            );
            return;
        }
        const bestRoute = bestRouteResult.data;
        // TODO: Handle error properly
        if (!bestRoute) throw new Error('failed to get best route');
        set(() => ({
            bestRoute: bestRoute,
        }));
    },
    addToken(token) {
        const { acceptedCommunityToken } = get();
        if (!acceptedCommunityToken.includes(token)) {
            const newCommunityTokens = [...acceptedCommunityToken, token];
            localStorage.setItem(
                'mts_widget_act',
                JSON.stringify(newCommunityTokens)
            );
            set(() => ({ acceptedCommunityToken: newCommunityTokens }));
        }
    },
    removeToken(token) {
        const { acceptedCommunityToken } = get();
        if (!acceptedCommunityToken.includes(token)) {
            const newCommunityTokens = acceptedCommunityToken.filter(
                (item) => item !== token
            );
            localStorage.setItem(
                'mts_widget_act',
                JSON.stringify(newCommunityTokens)
            );
            set(() => ({ acceptedCommunityToken: newCommunityTokens }));
        }
    },
    isInAgreedTokens(token) {
        const { acceptedCommunityToken } = get();
        return acceptedCommunityToken.includes(token);
    },
    setCommunityTokens(communityTokens) {
        localStorage.setItem('mts_widget_ct', String(communityTokens));
        set(() => ({ communityTokens }));
    },
    setSlippage(slippage) {
        set(() => ({ slippage }));
    },
    setIsLoading(isLoading) {
        set(() => ({ isLoading }));
    },
    setPayToken: async (token) => {
        set(() => ({ isSelectingToken: true }));
        useEventsStore.getState().onTokenSelect({ type: 'pay', asset: token });
        const { client } = get();
        if (!token) return;
        const result = await catchError(() =>
            client.tonapi.getAssetsRates([token.address])
        );
        if (result.error) {
            reportErrorWithToast(
                result.error,
                'Failed to get asset rates',
                'swap.store.ts setPayToken getAssetsRates :165'
            );
            return;
        }
        const rates = result.data;
        const tokenRate = rates.get(token.address);
        set(() => ({
            pay_token: token,
            pay_rate: tokenRate ?? null,
            pay_amount: 0n,
            receive_rate: null,
            receive_token: null,
            bestRoute: null,
            isSelectingToken: false,
        }));
    },
    async setPayAmount(amount) {
        const { client, pay_token, receive_token, slippage } = get();
        set(() => ({ pay_amount: amount }));
        if (!pay_token || !receive_token) return;
        set(() => ({ isFindingBestRoute: true }));
        const bestRouteResult = await catchError(() =>
            client.router.findBestRoute(
                pay_token.address,
                receive_token.address,
                amount,
                slippage === 'auto' ? undefined : slippage
            )
        );
        if (bestRouteResult.error) {
            reportErrorWithToast(
                bestRouteResult.error,
                'Failed to get best route',
                'swap.store.ts setPayAmount findBestRoute :196'
            );
            return;
        }
        const bestRoute = bestRouteResult.data;
        // TODO: Handle error properly
        if (!bestRoute) throw new Error('failed to get best route');
        set(() => ({ bestRoute, isFindingBestRoute: false }));
    },
    setReceiveToken: async (token) => {
        set(() => ({ isSelectingToken: true }));
        useEventsStore
            .getState()
            .onTokenSelect({ type: 'receive', asset: token });
        const { client, pay_token, pay_amount, slippage } = get();
        if (!token || token.address === pay_token?.address) return;
        const ratesResult = await catchError(() =>
            client.tonapi.getAssetsRates([token.address])
        );
        if (ratesResult.error) {
            reportErrorWithToast(
                ratesResult.error,
                'Failed to get asset rates',
                'swap.store.ts setReceiveToken getAssetsRates :215'
            );
            return;
        }
        const rates = ratesResult.data;
        const tokenRate = rates.get(token.address);
        set(() => ({
            receive_token: token,
            receive_rate: tokenRate ?? null,
            isFindingBestRoute: true,
            isSelectingToken: false,
        }));
        const onePayRouteResult = await catchError(() =>
            client.router.findBestRoute(
                pay_token!.address,
                token.address,
                toNano(1, pay_token!.decimal),
                slippage === 'auto' ? undefined : slippage
            )
        );
        if (onePayRouteResult.error) {
            reportErrorWithToast(
                onePayRouteResult.error,
                'Failed to get one pay route',
                'swap.store.ts setReceiveToken findBestRoute :238'
            );
            return;
        }
        const onePayRoute = onePayRouteResult.data;

        if (pay_amount > 0n && pay_token) {
            set(() => ({ onePayRoute }));
            const bestRouteResult = await catchError(() =>
                client.router.findBestRoute(
                    pay_token.address,
                    token.address,
                    pay_amount,
                    slippage === 'auto' ? undefined : slippage
                )
            );
            if (bestRouteResult.error) {
                reportErrorWithToast(
                    bestRouteResult.error,
                    'Failed to get best route',
                    'swap.store.ts setReceiveToken findBestRoute :258'
                );
                return;
            }
            const bestRoute = bestRouteResult.data;
            set(() => ({ bestRoute, isFindingBestRoute: false }));
        } else {
            set(() => ({ onePayRoute, isFindingBestRoute: false }));
        }
    },

    async addToAssets(newAssets) {
        if (!newAssets) return;
        set((state) => {
            const assetMap = new Map(
                (state.assets || []).map((asset) => [asset.address, asset])
            );

            newAssets.forEach((newAsset) => {
                if (newAsset && !assetMap.has(newAsset.address)) {
                    assetMap.set(newAsset.address, newAsset);
                }
            });

            const updatedAssets = Array.from(assetMap.values());
            return { assets: updatedAssets };
        });
    },

    async initializeApp() {
        const {
            client,
            slippage,
            setPayAmount,
            refetchBestRoute,
            refetchInterval,
        } = get();
        const {
            default_pay_token,
            default_receive_token,
            pin_tokens,
            default_pay_amount,
        } = useOptionsStore.getState().options;

        if (refetchInterval) {
            clearInterval(refetchInterval);
        }
        set({
            refetchInterval: setInterval(() => {
                const modalState = useSwapStore.getState().swapModal;
                if (modalState === ModalState.NONE) {
                    useWalletStore.getState().refetch();
                    refetchBestRoute();
                }
            }, 10000),
        });

        const getAsset = async (
            tokenAddress: string | undefined,
            fallback: string
        ): Promise<Asset | null> => {
            if (!tokenAddress) {
                const assetResult = await catchError(() =>
                    client.assets.getExactAsset(fallback)
                );
                if (assetResult.error) {
                    reportErrorWithToast(
                        assetResult.error,
                        'Failed to get asset',
                        'swap.store.ts initializeApp getAsset :305'
                    );
                    return null;
                }
                return assetResult.data;
            }
            try {
                const assetResult = await catchError(() =>
                    client.assets.getExactAsset(tokenAddress)
                );
                if (assetResult.error) {
                    reportErrorWithToast(
                        assetResult.error,
                        'Failed to get asset',
                        'swap.store.ts initializeApp getAsset :320'
                    );
                    return null;
                }
                return assetResult.data;
            } catch {
                const assetResult = await catchError(() =>
                    client.assets.getExactAsset(fallback)
                );
                if (assetResult.error) {
                    reportErrorWithToast(
                        assetResult.error,
                        'Failed to get asset',
                        'swap.store.ts initializeApp getAsset :333'
                    );
                    return null;
                }
                return assetResult.data;
            }
        };

        const getRates = async (
            token: Asset | null
        ): Promise<Prices | null> => {
            if (!token) return null;
            const ratesResult = await catchError(() =>
                client.tonapi.getAssetsRates([token.address])
            );
            if (ratesResult.error) {
                reportErrorWithToast(
                    ratesResult.error,
                    'Failed to get asset rates',
                    'swap.store.ts initializeApp getRates :352'
                );
                return null;
            }
            const rates = ratesResult.data;
            return rates.get(token.address) ?? { USD: 0 };
        };

        const initializeTokens = async () => {
            const payToken = await getAsset(default_pay_token, 'TON');
            const receiveToken = await getAsset(default_receive_token, '');

            if (!payToken) return;

            const payRate = await getRates(payToken);
            const receiveRate = await getRates(receiveToken);

            let onePayRoute: null | BestRoute = null;
            if (payToken && receiveToken) {
                const onePayRouteResult = await catchError(() =>
                    client.router.findBestRoute(
                        payToken.address,
                        receiveToken.address,
                        toNano(1, payToken!.decimal),
                        slippage === 'auto' ? undefined : slippage
                    )
                );
                if (onePayRouteResult.error) {
                    reportErrorWithToast(
                        onePayRouteResult.error,
                        'Failed to get one pay route',
                        'swap.store.ts initializeApp findBestRoute :383'
                    );
                    return;
                }
                onePayRoute = onePayRouteResult.data;
            }

            let pinnedTokens: Asset[] | null = null;
            if (pin_tokens && pin_tokens.length > 0) {
                const pinnedTokensResult = await catchError(() =>
                    client.assets.getAssets(pin_tokens)
                );
                if (pinnedTokensResult.error) {
                    reportErrorWithToast(
                        pinnedTokensResult.error,
                        'Failed to get pinned tokens',
                        'swap.store.ts initializeApp getAssets :399'
                    );
                    return;
                }
                pinnedTokens = pinnedTokensResult.data;
            }
            useEventsStore
                .getState()
                .onTokenSelect({ type: 'pay', asset: payToken });
            if (receiveToken) {
                useEventsStore
                    .getState()
                    .onTokenSelect({ type: 'receive', asset: receiveToken });
            }
            set({
                pay_token: payToken,
                pay_rate: payRate,
                receive_token: receiveToken,
                receive_rate: receiveRate,
                onePayRoute,
                pinnedTokens,
                isLoading: false,
            });
        };

        await initializeTokens();
        setPayAmount(default_pay_amount ? BigInt(default_pay_amount) : 0n);
    },
    async refetchBestRoute() {
        const {
            pay_token,
            receive_token,
            pay_amount,
            slippage,
            client,
            swapModal,
        } = get();
        if (!pay_token || !receive_token) return;
        if (swapModal !== ModalState.NONE) return;
        set(() => ({ isFindingBestRoute: true }));
        const bestRouteResult = await catchError(() =>
            client.router.findBestRoute(
                pay_token.address,
                receive_token.address,
                pay_amount,
                slippage === 'auto' ? undefined : slippage
            )
        );
        if (bestRouteResult.error) {
            reportErrorWithToast(
                bestRouteResult.error,
                'Failed to get best route',
                'swap.store.ts refetchBestRoute findBestRoute :436'
            );
            return;
        }
        const bestRoute = bestRouteResult.data;
        // TODO: Handle error properly
        if (!bestRoute) throw new Error('failed to get best route');
        set(() => ({ bestRoute, isFindingBestRoute: false }));
    },
}));
