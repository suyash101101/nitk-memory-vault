import { BigInt } from "@graphprotocol/graph-ts"
import {
  Approval as ApprovalEvent,
  ApprovalForAll as ApprovalForAllEvent,
  MemoryMinted as MemoryMintedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  Transfer as TransferEvent
} from "../generated/NITKMemoryVault/NITKMemoryVault"
import {
  Memory,
  Approval,
  ApprovalForAll,
  OwnershipTransferred,
  Transfer
} from "../generated/schema"

export function handleMemoryMinted(event: MemoryMintedEvent): void {
  let entity = new Memory(
    event.transaction.hash.concatI32(event.logIndex.toI32()).toHexString()
  )
  
  entity.tokenId = event.params.tokenId
  entity.creator = event.params.creator
  entity.ipfsHash = event.params.ipfsHash
  entity.eventType = event.params.eventType
  entity.date = event.params.date
  entity.tags = []

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleApproval(event: ApprovalEvent): void {
  let entity = new Approval(
    event.transaction.hash.concatI32(event.logIndex.toI32()).toHexString()
  )
  
  entity.owner = event.params.owner
  entity.approved = event.params.approved
  entity.tokenId = event.params.tokenId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleApprovalForAll(event: ApprovalForAllEvent): void {
  let entity = new ApprovalForAll(
    event.transaction.hash.concatI32(event.logIndex.toI32()).toHexString()
  )
  
  entity.owner = event.params.owner
  entity.operator = event.params.operator
  entity.approved = event.params.approved

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnershipTransferred(event: OwnershipTransferredEvent): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32()).toHexString()
  )
  
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32()).toHexString()
  )
  
  entity.from = event.params.from
  entity.to = event.params.to
  entity.tokenId = event.params.tokenId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}