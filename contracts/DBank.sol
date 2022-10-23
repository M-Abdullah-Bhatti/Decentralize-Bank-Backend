// new contract:
// SPDX-License-Identifier:MIT

pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

error Bank__MsgSender_NotMinter();
error Bank__LessDeposit(string);
error Bank__NoPreviousDeposit();
error Bank__OverWithDraw(string);
error Bank__LessCollateral(string);
error Bank__LoanAlreadyActive();
error Bank__NoActiveLoan();
error Bank__AddressNotApprovedForPayOff();
error Bank__TokensNotTransferred();

contract DBank is ERC20, ReentrancyGuard {
    // BankToken private token;
    address public minter;

    // Mappings
    mapping(address => uint256) public etherBalanceOf;
    mapping(address => uint256) private depositStart;
    mapping(address => uint256) private collateralEther;

    mapping(address => bool) private isDeposited;
    mapping(address => bool) private isBorrowed;

    event MinterChanged(address indexed from, address to);

    event Deposit(address indexed user, uint256 etherAmount, uint256 timeStart);
    event Withdraw(
        address indexed user,
        uint256 etherAmount,
        uint256 depositTime,
        uint256 interest
    );
    event Borrow(
        address indexed user,
        uint256 collateralEtherAmount,
        uint256 borrowedTokenAmount
    );
    event Payoff(address indexed user, uint256 fee);

    constructor() ERC20("Bank Token", "BTK") {
        minter = msg.sender;
    }

    modifier onlyAdmin() {
        if (msg.sender != minter) {
            revert Bank__MsgSender_NotMinter();
        }
        _;
    }

    function mint(address account, uint256 amount)  internal  {
        _mint(account, amount);
    }

    function grantRole(address dbank) public onlyAdmin returns (bool) {
        minter = dbank;
        emit MinterChanged(msg.sender, dbank);
        return true;
    }

    function deposit() public payable {
       
         if (msg.value <= 0) {
            revert Bank__LessCollateral(
                "Collateral amount must be greater than 0 ETH"
            );
        }

        //increase msg.sender ether deposit balance
        etherBalanceOf[msg.sender] = etherBalanceOf[msg.sender] + msg.value;
        //start msg.sender hodling time
        depositStart[msg.sender] = depositStart[msg.sender] + block.timestamp;
        //set msg.sender deposit status to true
        isDeposited[msg.sender] = true;
        //emit Deposit event
        emit Deposit(msg.sender, msg.value, block.timestamp);
    }

    function withdraw(uint256 amount) payable public nonReentrant{
        //check if msg.sender deposit status is true
       
        if (isDeposited[msg.sender] == false) {
            revert Bank__NoPreviousDeposit();
        }

        //assign msg.sender ether deposit balance to variable for event
        uint256 userBalance = etherBalanceOf[msg.sender];

       
        if (amount > userBalance) {
            revert Bank__OverWithDraw("Withdraw can't be more than deposit");
        }
        //check user's hodl time
        uint256 depositTime = block.timestamp - depositStart[msg.sender];
        //calc interest per second with 10% APY
        uint256 interestPerSecond = 31668017 * (userBalance / 1e16);
        //calc accrued interest
        uint256 interest = interestPerSecond * depositTime;
        //send eth to user

        payable(msg.sender).transfer(amount);
        etherBalanceOf[msg.sender] = etherBalanceOf[msg.sender] - amount;
        //send interest in tokens to user
        mint(msg.sender, interest);
        //reset depositer data
        if( etherBalanceOf[msg.sender] == 0){
            isDeposited[msg.sender] = false;
            depositStart[msg.sender] = 0;
        }
      
        emit Withdraw(msg.sender, userBalance, depositTime, interest);
    }

    function borrow() public payable nonReentrant{
       
        if (isBorrowed[msg.sender] == true) {
            revert Bank__LoanAlreadyActive();
        }

        if (msg.value <= 0) {
            revert Bank__LessCollateral(
                "Collateral amount must be greater than 0 ETH"
            );
        }

        //add msg.value to ether collateral
        collateralEther[msg.sender] = collateralEther[msg.sender] + msg.value;
        //calc tokens amount to mint, 50% of msg.value
        uint256 tokensToMint = collateralEther[msg.sender] / 2;
        //mint&send tokens to user
        mint(msg.sender, tokensToMint);
        //activate borrower's loan status
        isBorrowed[msg.sender] = true;

        emit Borrow(msg.sender, collateralEther[msg.sender], tokensToMint);
    }

    function payOff() public {
       
        if(isBorrowed[msg.sender] ==false ){
            revert Bank__NoActiveLoan();
        }

        bool isApproved = approve(msg.sender, collateralEther[msg.sender] / 2);
        if(!isApproved){
            revert Bank__AddressNotApprovedForPayOff();
        }
     
        bool isTransfered = transferFrom(msg.sender, address(this), collateralEther[msg.sender] / 2);
        if(!isTransfered){
            revert Bank__TokensNotTransferred();
        }

        //calc 10% fee
        uint256 fee = collateralEther[msg.sender] / 10;
        //send user's collateral minus fee
        payable(msg.sender).transfer(collateralEther[msg.sender] - fee);
        //reset borrower's data
        isBorrowed[msg.sender] = false;
        collateralEther[msg.sender] = 0;

        emit Payoff(msg.sender, fee);
    }

    // Getter Functions

    function getEtherBalanceOf() external view returns (uint256) {
        return etherBalanceOf[msg.sender];
    }

    function getDepositStartTime(address user) external view returns (uint256) {
        return depositStart[user];
    }

    function getCollateralEther(address user) external view returns (uint256) {
        return collateralEther[user];
    }

    function chechIsDeposited(address user) external view returns (bool) {
        return isDeposited[user];
    }

    function chechIsBorrowed(address user) external view returns (bool) {
        return isBorrowed[user];
    }
}





