# Spad game Contract

## Problem description

1) I (the developer of SC) can't figure out how to complete rounds after some period.
I've created variables `duration` and `numOfevent`, but I don't know how to make the contract wait some time and call the `finish_event` function to start a new round.
2) Line 45 "Review the new winner". I'm not sure if it is correct to use JS Object methods with UnorderedMap, since I have not found info about this in the "UnorderedMap" docs.

<br />

# The smart contract exposes methods to handle transfering $NEAR to the smart contract.

```ts
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
```

<br />