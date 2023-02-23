// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.19;
pragma experimental ABIEncoderV2;

interface Sort {
    function sort(uint[] memory) external pure returns(uint[] memory);
}

contract QuicSort is Sort {
    function sort(uint[] memory arr) public pure returns(uint[] memory) {
        quicSort(arr, 0, int(arr.length - 1));
        return arr;
    }

    function quicSort(uint[] memory arr, int left, int right) public pure {
        int i = left;
        int j = right;
        if (i == j) return;
        uint pivot = arr[uint(left + (right - left) / 2)];
        while (i <= j) {
            while (arr[uint(i)] < pivot) i++;
            while (pivot < arr[uint(j)]) j--;
            if (i <= j) {
                (arr[uint(i)], arr[uint(j)]) = (arr[uint(j)], arr[uint(i)]);
                i++; j--;
            }
        }
        if (left < j)
            quicSort(arr, left, j);
        if (i < right)
            quicSort(arr, i, right);
    }
}
