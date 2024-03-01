import {
    Badge,
    Box,
    Button,
    Container,
    Flex,
    Heading,
    Section,
} from "@radix-ui/themes";
import { useEffect, useState } from "react";
import {
    EIP6963EventNames,
    LOCAL_STORAGE_KEYS,
    SupportedChainId,
    isPreviouslyConnectedProvider,
    isSupportedChain,
    switchChain,
} from "./config";
import {
    CodeSandboxLogoIcon,
    DrawingPinIcon,
    RocketIcon,
} from "@radix-ui/react-icons";
import WalletButton from "./components/WalletButtons";

function App() {
    /**
     * @title injectedProviders
     * @dev State variable to store injected providers we have recieved from the extension as a map.
     */
    const [injectedProviders, setInjectedProviders] = useState<
        Map<string, EIP6963ProviderDetail>
    >(new Map());

    /**
     * @title connection
     * @dev State variable to store connection information.
     */
    const [connection, setConnection] = useState<{
        providerUUID: string;
        accounts: string[];
        chainId: number;
    } | null>(null);

    useEffect(() => {
        /**
         * @title onAnnounceProvider
         * @dev Event listener for EIP-6963 announce provider event.
         * @param event The announce provider event.
         */
        const onAnnounceProvider = (event: EIP6963AnnounceProviderEvent) => {
            const { icon, rdns, uuid, name } = event.detail.info;

            if (!icon || !rdns || !uuid || !name) {
                console.error("invalid eip6963 provider info received!");
                return;
            }
            setInjectedProviders((prevProviders) => {
                const providers = new Map(prevProviders);
                providers.set(uuid, event.detail);
                return providers;
            });

            // This ensures that on page reload, the provider that was previously connected is automatically connected again.
            // It help prevent the need to manually reconnect again when the page reloads
            if (isPreviouslyConnectedProvider(rdns)) {
                handleConnectProvider(event.detail);
            }
        };

        // Add event listener for EIP-6963 announce provider event
        window.addEventListener(
            EIP6963EventNames.Announce,
            onAnnounceProvider as EventListener
        );

        // Dispatch the request for EIP-6963 provider
        window.dispatchEvent(new Event(EIP6963EventNames.Request));

        // Clean up by removing the event listener and resetting injected providers
        return () => {
            window.removeEventListener(
                EIP6963EventNames.Announce,
                onAnnounceProvider as EventListener
            );
            setInjectedProviders(new Map());
        };
    }, []);

    /**
     * @title handleConnectProvider
     * @dev Function to handle connecting to a provider.
     * @param selectedProviderDetails The selected provider details.
     */
    async function handleConnectProvider(
        selectedProviderDetails: EIP6963ProviderDetail
    ) {
        const { provider, info } = selectedProviderDetails;
        try {
            const accounts = (await provider.request({
                method: "eth_requestAccounts",
            })) as string[];
            const chainId = await provider.request({ method: "eth_chainId" });
            setConnection({
                providerUUID: info.uuid,
                accounts,
                chainId: Number(chainId),
            });
            localStorage.setItem(
                LOCAL_STORAGE_KEYS.PREVIOUSLY_CONNECTED_PROVIDER_RDNS,
                info.rdns
            );
        } catch (error) {
            console.error(error);
            throw new Error("Failed to connect to provider");
        }
    }

    /**
     * @title handleSwitchChain
     * @dev Function to handle switching the chain.
     */
    const handleSwitchChain = async () => {
        try {
            if (!connection) return;
            const provider = injectedProviders.get(
                connection.providerUUID
            )!.provider;
            const chain = isSupportedChain(connection.chainId)
                ? connection.chainId === SupportedChainId.SEPOLIA
                    ? SupportedChainId.NAHMII3_TESTNET
                    : SupportedChainId.SEPOLIA
                : SupportedChainId.SEPOLIA;
            await switchChain(chain, provider);
            setConnection({
                ...connection,
                chainId: chain,
            });
        } catch (error) {
            console.error(error);
        }
    };

    /**
     * @title handleDisconnect
     * @dev Function to handle disconnecting from the provider.
     */
    const handleDisconnect = () => {
        setConnection(null);
        localStorage.removeItem(
            LOCAL_STORAGE_KEYS.PREVIOUSLY_CONNECTED_PROVIDER_RDNS
        );
    };

    const connectedInjectectProvider =
        connection && injectedProviders.get(connection.providerUUID);

    return (
        <Box>
            <Section py="4" className="border-b p-4">
                <Container>
                    <Flex align={"center"} className="gap-2">
                        <CodeSandboxLogoIcon width={36} height={36} />
                        <Heading as="h1">EIP6963 Playground</Heading>
                    </Flex>
                </Container>
            </Section>
            <Container>
                <Flex py="4" className="flex-col md:flex-row gap-4 p-4 md:p-0">
                    <Box className="w-full md:w-1/2">
                        <Flex align={"center"} className="gap-2 mb-4">
                            <Heading as="h2">
                                Available Injected wallets
                            </Heading>
                            <RocketIcon width={24} height={24} />
                        </Flex>
                        {injectedProviders.size === 0 ? (
                            <div>
                                You do not have any wallet extension installed
                                on your browser
                            </div>
                        ) : (
                            <Flex className="gap-2 mb-4 flex-wrap">
                                {Array.from(injectedProviders).map(
                                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                    ([_, { info, provider }]) => (
                                        <WalletButton
                                            key={info.uuid}
                                            handleConnect={
                                                handleConnectProvider
                                            }
                                            walletDetails={{ info, provider }}
                                            isConneted={
                                                connection?.providerUUID ===
                                                info.uuid
                                            }
                                        />
                                    )
                                )}
                            </Flex>
                        )}
                    </Box>
                    <Box className="w-full md:w-1/2">
                        <Flex align={"center"} className="gap-2">
                            <Heading as="h2">Connection Details</Heading>
                            <DrawingPinIcon width={24} height={24} />
                        </Flex>
                        <Box className="w-full">
                            {connectedInjectectProvider?.info ? (
                                <Flex className="flex-col gap-2">
                                    <Flex className="gap-2">
                                        <span>Connected to:</span>
                                        {
                                            <Flex gap="1" align="center">
                                                <span>
                                                    {}
                                                    {
                                                        connectedInjectectProvider
                                                            .info.name
                                                    }
                                                </span>{" "}
                                                <img
                                                    className="w-5 h-5 rounded"
                                                    src={
                                                        connectedInjectectProvider
                                                            .info.icon
                                                    }
                                                    alt={
                                                        connectedInjectectProvider
                                                            .info.name
                                                    }
                                                />
                                            </Flex>
                                        }
                                    </Flex>
                                    <Flex className="gap-2">
                                        <span>Chain ID:</span>
                                        <Flex gap="1" align="center">
                                            <span>{connection?.chainId}</span>
                                            {isSupportedChain(
                                                connection?.chainId
                                            ) ? (
                                                <Badge color="green">
                                                    Supported
                                                </Badge>
                                            ) : (
                                                <Badge color="orange">
                                                    Unsupported
                                                </Badge>
                                            )}
                                        </Flex>
                                    </Flex>
                                    <Flex className="gap-2">
                                        <span>Accounts:</span>
                                        <span>
                                            {connection?.accounts.map(
                                                (account) => (
                                                    <span key={account}>
                                                        {account}
                                                    </span>
                                                )
                                            )}
                                        </span>
                                    </Flex>
                                    <Flex>
                                        <Button
                                            onClick={handleSwitchChain}
                                            className="cursor-pointer"
                                        >
                                            Switch Chain
                                        </Button>
                                    </Flex>
                                    <Flex>
                                        <Button onClick={handleDisconnect}>
                                            Disconnect
                                        </Button>
                                    </Flex>
                                    <Flex></Flex>
                                </Flex>
                            ) : (
                                <Box>Not connected</Box>
                            )}
                        </Box>
                    </Box>
                </Flex>
            </Container>
        </Box>
    );
}

export default App;
