export interface NormalTransaction {
    blockNumber: string
    timeStamp: string
    hash?: string
    nonce?: string
    blockHash?: string
    transactionIndex?: string
    from?: string
    to?: string
    value: string
    gas: string
    gasPrice?: string
    isError: string
    txreceipt_status: string
    input: string
    contractAddress?: string
    cumulativeGasUsed: string
    gasUsed: string
    confirmations: string
    methodId?: string
    functionName?: string
}

export interface InternalTransaction {
    blockNumber: string
    timeStamp: string
    hash: string
    from: string
    to?: string
    value: string
    contractAddress?: string
    input?: string
    type: string
    gas: string
    gasUsed: string
    traceId: string
    isError: string
    errCode: string
}

export interface ERC20TokenTransferEvent {
    blockNumber: string
    timeStamp: string
    hash: string
    nonce: string
    blockHash: string
    from: string
    contractAddress: string
    to?: string
    value: string
    tokenName: string
    tokenSymbol: string
    tokenDecimal: string
    transactionIndex: string
    gas: string
    gasPrice?: string
    gasUsed: string
    cumulativeGasUsed: string
    /**  @deprecated */
    input: string
    confirmations: string
}

export interface ERC721TokenTransferEvent {
    blockNumber: string
    timeStamp: string
    hash: string
    nonce: string
    blockHash: string
    from: string
    contractAddress: string
    to?: string
    tokenID: string
    tokenName: string
    tokenSymbol: string
    tokenDecimal: string
    transactionIndex: string
    gas: string
    gasPrice?: string
    gasUsed: string
    cumulativeGasUsed: string
    /**  @deprecated */
    input: string
    confirmations: string
}

export interface ERC1155TokenTransferEvent {
    blockNumber: string
    timeStamp: string
    hash: string
    nonce: string
    blockHash: string
    from: string
    contractAddress: string
    to?: string
    tokenID: string
    tokenName: string
    tokenSymbol: string
    tokenDecimal: string
    transactionIndex: string
    gas: string
    gasPrice?: string
    gasUsed: string
    cumulativeGasUsed: string
    /**  @deprecated */
    input: string
    confirmations: string
}
