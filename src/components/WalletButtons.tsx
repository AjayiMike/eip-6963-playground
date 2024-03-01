import { Button } from "@radix-ui/themes";
import { DotFilledIcon } from "@radix-ui/react-icons";

const WalletButton: React.FC<{
    handleConnect: (walletDetails: EIP6963ProviderDetail) => void;
    walletDetails: EIP6963ProviderDetail;
    isConneted?: boolean;
}> = ({ walletDetails, handleConnect, isConneted }) => {
    return (
        <Button
            onClick={() => handleConnect(walletDetails)}
            className="flex"
            disabled={isConneted}
        >
            <img
                className="w-5 h-5 rounded"
                src={walletDetails.info.icon}
                alt={walletDetails.info.name}
            />
            <span>{walletDetails.info.name}</span>
            {isConneted && (
                <DotFilledIcon color="green" width={24} height={24} />
            )}
        </Button>
    );
};

export default WalletButton;
