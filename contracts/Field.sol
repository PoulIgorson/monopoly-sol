// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.19;
pragma experimental ABIEncoderV2;

import "./external/Strings.sol";
import "./Sort.sol";

contract Field {
    address public owner;
    bool public inAir; // Если true, нельзя изменять поле
    struct Cell {
        uint cost; // Начальная цена
        uint rent; // Аренда
        uint deposit; // Залог
        bool isSpec; // Если true, доступны нижние поля
        uint _salary; // Бонус за наступление на клекту
        bool _prison; // Тюрьма
        bool _parking; // Парковка / своюодная клетка
    }
    Cell[] field;

    Sort sort = new QuicSort();

    constructor() {
        owner = msg.sender;
        AddSpecCell(200, false, false);
    }

    modifier IsOwner {require(msg.sender == owner, "Field: you is not owner field"); _;}
    modifier EndGame {require(!inAir, "Field: game is not end"); _;}

    // Функция установки награды за прохождение круга
    function SetStartSalary(uint salary) public EndGame IsOwner {
        field[0]._salary = salary;
    }

    // Функция установки начала/конца игры
    function SetInAir(bool _inAir) public {
        inAir = _inAir;
    }

    // Функция получения количества клеток
    function CountCells() public view returns(uint) {
        return field.length;
    }

    // Функция доавления обычной клетки
    function AddCell(uint cost, uint rent, uint deposit) public EndGame IsOwner {
        Cell memory cell;
        cell.cost = cost;
        cell.rent = rent;
        cell.deposit = deposit;
        field.push(cell);
    }

    // Функция добавление списка обычных клеток
    function AddCells(uint[][] memory cells) public EndGame IsOwner {
        for (uint i = 0; i < cells.length; i++)
            AddCell(cells[i][0], cells[i][1], cells[i][1]);
    }

    // Функция добавления особой клетки
    function AddSpecCell(uint salary, bool prison, bool parking) public EndGame IsOwner {
        uint8 check = 0;
        if (salary > 0) check += 1;
        if (prison) check += 1;
        if (parking) check += 1;
        require(check == 1, "Field: you must specify one of the parameters");

        Cell memory cell;
        cell._salary = salary;
        cell._prison = prison;
        cell._parking = parking;
        field.push(cell);
    }

    // Функция удаления клетки по ее индексу
    function DelCell(uint index) public EndGame IsOwner {
        require(index < field.length, "Field: index does not exists");
        for (uint i = index; i < field.length - 1; i++) {
            field[i] = field[i+1];
        }
        field.pop();
    }

    // Функция удаления клеткок по их индексу
    function DelCells(uint[] memory indexes) public EndGame IsOwner {
        indexes = sort.sort(indexes);
        uint count_delete = 0;
        for (uint i = 0; i < indexes.length; i++) {
            if (indexes[i] >= count_delete)
                DelCell(indexes[i] - count_delete);
            count_delete++;
        }
    }

    // Функция получения количество свойсв у клетки
    function GetCountFieldCell() public pure returns(uint) {
        return uint(7);
    }

    // Функция получения информации о клетке
    function GetCell(uint index) public view returns(string[] memory) {
        require(index < field.length, "Field: index does not exists");
        string[] memory info = new string[](7);
        info[0] = Strings.toString(field[index].cost);
        info[1] = Strings.toString(field[index].rent);
        info[2] = Strings.toString(field[index].deposit);

        if (field[index].isSpec) info[3] = "true";
        else info[3] = "false";
        
        info[4] = Strings.toString(field[index]._salary);

        if (field[index]._prison) info[5] = "true";
        else info[5] = "false";

        if (field[index]._parking) info[6] = "true";
        else info[6] = "false";

        return info;
    }

    // Функция получения информации о поле
    function GetField() public view returns(string[][] memory) {
        string[][] memory info = new string[][](field.length);
        for (uint i = 0; i < field.length; i++)
            info[i] = GetCell(i);
        return info;
    }

    // Функция получения клетки
    function GetCellStruct(uint index) public view returns(Cell memory) {
        require(index < field.length, "Field: index does not exists");
        return field[index];
    }

    // Функция получения поля
    function GetFieldStruct() public view returns(Cell[] memory) {
        return field;
    }
}
