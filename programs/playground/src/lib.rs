use anchor_lang::{ prelude::*, solana_program::bpf_loader_upgradeable };

declare_id!("EwPUHhorTGBKyNu7vFezfFCFej5GgNmXmABzs4VKqPEo");

#[error_code]
pub enum ErrorCode {
  UpgradeAuthorityMismatch,
}

#[derive(Accounts)]
pub struct CloseAccounts<'info> {
  #[account(
    mut,
    //disabled for testing only because localnet uses native account loader as upgrade authority
    //  which can't be passed in as a mut account
    // constraint = program_data.upgrade_authority_address == Some(upgrade_authority.key()) @ ErrorCode::UpgradeAuthorityMismatch
  )]
  /// CHECK: leave britney alone
  pub upgrade_authority: UncheckedAccount<'info>, //= recipient of the recovered rent

  #[account(
    seeds = [crate::ID.as_ref()],
    bump,
    seeds::program = bpf_loader_upgradeable::ID,
  )]
  pub program_data: Account<'info, ProgramData>,

  //accounts to be closed as remaining accounts
}

#[program]
pub mod playground {
  use super::*;

  pub fn close_accounts(ctx: Context<CloseAccounts>) -> Result<()> {
    let mut recovered_lamports = 0;

    for account in ctx.remaining_accounts.iter() {
      recovered_lamports += account.lamports();
      **account.try_borrow_mut_lamports()? = 0;
    }

    **ctx.accounts.upgrade_authority.try_borrow_mut_lamports()? += recovered_lamports;

    Ok(())
  }

// ----------- only testing functionality below -----------

  pub fn create_account1(ctx: Context<CreateAccount1>) -> Result<()> {
    ctx.accounts.counter.counter = 1;
    Ok(())
  }

  pub fn create_account2(ctx: Context<CreateAccount2>) -> Result<()> {
    ctx.accounts.counter.counter = 2;
    Ok(())
  }
}

#[account]
pub struct Counter {
  pub counter: u64,
}

#[derive(Accounts)]
pub struct CreateAccount1<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
    init,
    payer = payer,
    space = 8 + 8,
    seeds = [b"counter".as_ref(), &(1u64).to_be_bytes().as_ref()],
    bump,
  )]
  pub counter: Account<'info, Counter>,

  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateAccount2<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
    init,
    payer = payer,
    space = 8 + 8,
    seeds = [b"counter".as_ref(), &(2u64).to_be_bytes().as_ref()],
    bump,
  )]
  pub counter: Account<'info, Counter>,

  pub system_program: Program<'info, System>,
}
