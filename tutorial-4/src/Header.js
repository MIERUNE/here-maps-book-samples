import './Header.css';

function Header({ toggleMenu }) {
    return (
        <div className="header">
            <button onClick={toggleMenu}>メニュー</button>
            <h1>バスナビ</h1>
        </div>
    );
}

export default Header;
