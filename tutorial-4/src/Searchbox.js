import React, { useState } from 'react';

function SearchComponent({ buttonClick }) {
    // テキストボックスに入力された値を保存する変数
    const [searchTerm, setSearchTerm] = useState('');

    // テキストボックスの値が変更された際に実行される関数
    const handleInputChange = (event) => {
        setSearchTerm(event.target.value);
    };

    // 検索ボタンがクリックされた際に実行される関数
    const handleSearch = () => {
        buttonClick(searchTerm);
    };

    return (
        <div>
            <input
                type="text"
                value={searchTerm}
                onChange={handleInputChange}
                placeholder="Search here..."
            />
            <button onClick={handleSearch}>Search</button>
        </div>
    );
}

export default SearchComponent;
