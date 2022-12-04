import { NearBindgen, near, call, view, initialize, UnorderedMap } from 'near-sdk-js'

import { assert } from './utils'
import { Participant, STORAGE_COST} from './model'

// type Participant = {attachedToPool: bigint, attachedToCharity: bigint}

@NearBindgen({})
class SpadContract {

  participants = new UnorderedMap<bigint>('map-uid-1');
  duration: bigint // Duration of the event
  winner = "mxrnsm.testnet" // Init winner var
  numOfevent = 1

  @initialize({ privateFunction: true })
  init({ winner }: { winner: string }) {
    this.winner = winner
  }

  // Can be invoked by everyone
  @call({ payableFunction: true })
  add_value() {
    // Get who is calling the method and how much $NEAR they attached
    let accountId = near.predecessorAccountId();
    let attachedAmount = near.attachedDeposit() as bigint;

    let attachedSoFar = this.participants.get(accountId, {defaultValue: BigInt(0)});
    let toAdd = attachedAmount;

    // This is the user's first donation, lets register it, which increases storage
    if (attachedSoFar == BigInt(0)) {
      assert(attachedAmount > STORAGE_COST, `Attach at least ${STORAGE_COST} yoctoNEAR`);

      // Subtract the storage cost to the amount to transfer to the pool
      toAdd -= STORAGE_COST
    }

    // Persist in storage the amount attached so far
    attachedSoFar += toAdd
    this.participants.set(accountId, attachedSoFar)
    near.log(`Thank you ${accountId} for participating! You attached a total of ${attachedSoFar}`);

    // Review the new winner
    this.winner = Object.keys(this.participants).reduce((a, b) => this.participants.get(a) > this.participants.get(b) ? a : b);

    // Return the total amount attached so far
    return attachedSoFar.toString()
  }

  @call({ privateFunction: true })
  finish_event() {
    // Send the money to the winner and empty the list of participants
    const promise = near.promiseBatchCreate(this.winner)
    near.promiseBatchActionTransfer(promise, near.accountBalance() - STORAGE_COST) // Leave some minimal amount in the SC
    this.participants.clear()
    this.numOfevent++
  }

  @view({})
  get_current_winner(): string { return this.winner }

  @view({})
  number_of_current_event(): number { return this.numOfevent }

  @view({})
  number_of_participants(): number { return this.participants.length }

  @view({})
  get_participants({ from_index = 0, limit = 50 }: { from_index: number, limit: number }): Participant[] {
    let ret: Participant[] = []
    let end = Math.min(limit, this.participants.length)
    for (let i = from_index; i < end; i++) {
      const account_id: string = this.participants.keys.get(i) as string
      const participant: Participant = this.get_participant({ account_id })
      ret.push(participant)
    }
    return ret
  }

  @view({})
  get_participant({ account_id }: { account_id: string }): Participant {
    return {
      account_id,
      total_amount: this.participants.get(account_id).toString()
    }
  }
}