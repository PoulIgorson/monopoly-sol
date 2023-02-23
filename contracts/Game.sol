// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.19;
pragma experimental ABIEncoderV2;

import "./external/Strings.sol";
import "./external/_strings.sol";


// Rundom number
contract Random {
    uint randNoice;

    function RandUint() external returns(uint) {
        return uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, randNoice++)));
    }
}

// Concatenate strings
contract Concatenate {
    using strings for *;

    function Concat(string calldata s1, string calldata s2) external pure returns(string memory) {
        return s1.toSlice().concat(s2.toSlice());
    }
}

interface IField {
    struct Cell {
        uint cost; // Начальная цена
        uint rent; // Аренда
        uint deposit; // Залог
        bool isSpec; // Если true, доступны нижние поля
        uint _salary;
        bool _prison;
        bool _parking;
    }

    function SetInAir(bool) external;
    function AddCell(uint, uint, uint) external;
    function AddCells(uint[][] memory) external;
    function AddSpecCell(uint, bool, bool) external;
    function DelCell(uint) external;
    function DelCells(uint[] calldata) external;
    function GetCountFieldCell() external pure returns(uint);
    function GetCell(uint) external view returns(string[] memory);
    function GetCellStruct(uint) external view returns(Cell memory);
    function GetField() external view returns(string[][] memory);
    function GetFieldStruct() external view returns(Cell[] memory);
    function CountCells() external view returns(uint);
}


contract Game {
    bool public inAir; // Если true, нельзя изменять игру
    address public owner;
    IField field;
    struct Player { // Игрок на поле
        address user;
        uint index;
        uint balance;
        bool WantLeftGame;
        uint8 prison;
    }
    struct InfoCell { // Информацция о владении клетки
        uint statusSale; // 0 - Свободно, 1 - Куплен, 2 - Заложен
        address owner;
    }
    mapping(address => Player) public players;
    mapping(uint => InfoCell) ownersCell;
    address[] public playerAddresses;
    uint public indexCurPlayer;
    uint numMoveStep = 1;
    uint public moveTime;
    Random random = new Random();
    Concatenate concatenate = new Concatenate();

    modifier IsOwner {require(msg.sender == owner, "Game: you is not owner game"); _;}
    modifier IsPlayer {require(players[msg.sender].user != address(0), "Game: you is not player"); _;}
    modifier EndGame {require(!inAir, "Game: game is not end"); _;}
    modifier INAIR {require(inAir, "Game: game is offline"); _;}

    event STARTGAME(uint time);
    event ENDGAME(uint time);
    event NEWPLAYER(address indexed user);
    event LEFTGAME(address indexed user);
    event WANTLEFtGAME(address indexed user);
    event NOTWANTLEFtGAME(address indexed user);

    event ROLLDICE(uint indexed indexPlayer, uint indexed dice1, uint indexed dice2);
    event NEXTPLAYER(uint indexed indexPlayer);
    event BUYCELL(uint indexed indexPlayer, uint indexed index, uint indexed cost);
    event DEPOSITCELL(uint indexed indexPlayer, uint indexed index, uint indexed deposit);
    event UpdateBalance(uint indexed indexPlayer, bytes1 sign, uint amount);

    constructor(address _field, uint _moveTime) {
        owner = msg.sender;
        moveTime = _moveTime;
        field = IField(_field);
    }

    // Фукнция смены поля
    function ChangeField(address _field) public EndGame IsOwner {
        field = IField(_field);
    }

    // Функция начала игры
    function Start() public EndGame IsOwner {
        inAir = true;
        field.SetInAir(true);
        emit STARTGAME(block.timestamp);
    }

    // Функция конца игры
    function TheEnd() public INAIR IsOwner {
        inAir = false;
        field.SetInAir(false);
        emit ENDGAME(block.timestamp);
    }

    // Функция очищения желающих выйти из игры
    function ClearWantLeftGame() public IsOwner {
        for (uint i = 0; i < CountPlayers(); i++)
            players[playerAddresses[i]].WantLeftGame = false;
    }

    // Количество желающих выйти из игры
    function CountWantLeftGame() public view returns(uint) {
        uint count = 0;
        for (uint i = 0; i < CountPlayers(); i++)
            if (players[playerAddresses[i]].WantLeftGame)
                count += 1;
        return count;
    }

    // Количество игроков
    function CountPlayers() public view returns(uint) {
        return playerAddresses.length;
    }

    // Функция присоединения к игре
    function JoinToGame() public payable EndGame {
        require(msg.value == 0.2 ether, "Game: for join to game need 0.2 ether");
        require(players[msg.sender].user != msg.sender, "Game: you already in the game");

        playerAddresses.push(msg.sender);
        players[msg.sender] = Player(msg.sender, 0, 0, false, 0);
        emit NEWPLAYER(msg.sender);
    }

    // Функция выхода из игры
    function LeftGame() public IsPlayer EndGame {
        delete players[msg.sender];
        uint index = 0;
        for (uint i = 0; i < CountPlayers() - 1; i++) {
            if (playerAddresses[i] == msg.sender) {
                index = i;
            }
            if (index != 0 ) {
                playerAddresses[i] = playerAddresses[i + 1];
            }
        }
        playerAddresses.pop();
    }

    // Выставить отметку, что хочешь выйти
    function WantLeftGame() public IsPlayer INAIR {
        players[msg.sender].WantLeftGame = true;
        emit WANTLEFtGAME(msg.sender);
    }

    // Выставить отметку, что больше не хочешь выйти
    function NotWantLeftGame() public IsPlayer INAIR {
        players[msg.sender].WantLeftGame = false;
        emit NOTWANTLEFtGAME(msg.sender);
    }

    // Первый этап хода, бросок кубиков и вывод информации о текущей клетки игрока
    function RollDice() public INAIR returns(string[][] memory) {
        require(msg.sender == playerAddresses[indexCurPlayer], "Game: now is not your move");
        require(numMoveStep == 1, "Game: now is not this step");
        uint dice1 = random.RandUint() % 6 + 1;
        uint dice2 = random.RandUint() % 6 + 1;
        string[][] memory info = new string[][](4);
        string memory onDiceDice1 = concatenate.Concat("On dice: ", Strings.toString(dice1));
        string memory commaDice2 = concatenate.Concat(", ", Strings.toString(dice2));
        info[0] = new string[](1);
        info[0][0] = concatenate.Concat(onDiceDice1, commaDice2);

        emit ROLLDICE(indexCurPlayer, dice1, dice2);

        IField.Cell memory curCell = field.GetCellStruct(players[msg.sender].index);
        if (curCell.isSpec && curCell._prison) {
            players[msg.sender].prison += 1;
            if (players[msg.sender].prison != 3) {
                indexCurPlayer += 1;
                indexCurPlayer %= playerAddresses.length;
                info[1] = new string[](1);
                info[1][0] = concatenate.Concat("You on cell of prison. Move next player: ", Strings.toString(indexCurPlayer));
                emit NEXTPLAYER(indexCurPlayer);
                return info;
            } else {
                players[msg.sender].prison = 0;
                info[1] = new string[](1);
                info[1][0] = "You left the prison";
            }
        } else if (ownersCell[players[msg.sender].index].owner != address(0) && ownersCell[players[msg.sender].index].owner != msg.sender) {
            players[msg.sender].balance -= curCell.rent;
            players[ownersCell[players[msg.sender].index].owner].balance += curCell.rent;
            emit UpdateBalance(players[msg.sender].index, '-', curCell.rent);
            emit UpdateBalance(players[ownersCell[players[msg.sender].index].owner].index, '+', curCell.rent);
            info[1] = new string[](1);
            info[1][0] = concatenate.Concat("You balance is updated: renting another player's cell: -", Strings.toString(curCell.rent));
        }

        players[msg.sender].index += dice1 + dice2;
        bool finish = (players[msg.sender].index >= field.CountCells());
        players[msg.sender].index %= field.CountCells();
        info[2] = new string[](1);
        info[2][0] = concatenate.Concat("Your new position: ", Strings.toString(players[msg.sender].index));

        if (curCell.isSpec && curCell._salary > 0) {
            players[msg.sender].balance += curCell._salary;
        } else if (finish) {
            players[msg.sender].balance += field.GetCellStruct(0)._salary;
        }

        info[3] = new string[](field.GetCountFieldCell());
        info[3] = GetCell(players[msg.sender].index);

        numMoveStep = 2;

        return info;
    }

    // Функция передачи хода
    function PassMove() public IsPlayer INAIR returns(string[] memory) {
        require(msg.sender == playerAddresses[indexCurPlayer], "Game: now is not your move");
        require(numMoveStep == 2, "Game: now is not this step");
        indexCurPlayer += 1;
        indexCurPlayer %= playerAddresses.length;
        numMoveStep = 1;
        string[] memory info = new string[](1);
        info[0] = concatenate.Concat("You passed move. Move next player: ", Strings.toString(indexCurPlayer));
        emit NEXTPLAYER(indexCurPlayer);
        return info;
    }

    // Функция покупки клетки
    function BuyCell() public IsPlayer INAIR returns(string[][] memory) {
        require(msg.sender == playerAddresses[indexCurPlayer], "Game: now is not your move");
        require(numMoveStep == 2, "Game: now is not this step");
        
        IField.Cell memory curCell = field.GetCellStruct(players[msg.sender].index);
        require(!curCell.isSpec, "Game: this cell is not for sale");
        require(ownersCell[players[msg.sender].index].statusSale == 0, "Game: this cell is saled");
        require(
            players[msg.sender].balance >= curCell.cost,
            concatenate.Concat("Game: insufficient funds. ", concatenate.Concat(Strings.toString(curCell.cost), " required"))
        );
        
        ownersCell[players[msg.sender].index].owner = msg.sender;
        ownersCell[players[msg.sender].index].statusSale = 2;

        string[][] memory info = new string[][](1);
        info[0] = new string[](1);
        info[0][0] = concatenate.Concat("You buy cell: ", Strings.toString(players[msg.sender].index));
        emit BUYCELL(indexCurPlayer, players[msg.sender].index, curCell.cost);
        return info;
    }

    // Функция заложения клетки
    function DepositCell(uint index) public IsPlayer INAIR returns(string[][] memory) {
        require(msg.sender == playerAddresses[indexCurPlayer], "Game: now is not your move");
        require(numMoveStep == 2, "Game: now is not this step");

        IField.Cell memory curCell = field.GetCellStruct(players[msg.sender].index);
        require(!curCell.isSpec, "Game: this cell is not for deposit");
        require(ownersCell[index].owner == msg.sender, "Game: you is not owner this cell");
        require(ownersCell[players[msg.sender].index].statusSale != 2, "Game: this cell already deposit");
        require(ownersCell[players[msg.sender].index].statusSale == 1, "Game: this cell is not saled");

        ownersCell[players[msg.sender].index].statusSale = 2;
        players[msg.sender].balance += curCell.deposit;

        string[][] memory info = new string[][](1);
        info[0] = new string[](1);
        info[0][0] = concatenate.Concat("You deposit cell: ", Strings.toString(players[msg.sender].index));
        emit DEPOSITCELL(indexCurPlayer, players[msg.sender].index, curCell.deposit);
        return info;
    }

    // Функция вывода информаци о клетки
    function GetCell(uint index) public view returns(string[] memory) {
        return field.GetCell(index);
    }

    // Функция вывода информаци о поле
    function GetField() public view returns(string[][] memory) {
        return field.GetField();
    }

    // Функция вывода информаци об игроке
    function GetPlayerInfo(address addr) public view returns(Player memory) {
        require(players[addr].user != address(0), "Game: got address is not player");
        return players[addr];
    }
}
