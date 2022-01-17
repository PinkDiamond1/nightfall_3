import React from 'react';
import { connect } from 'react-redux';
import { Table, Button, Container, Icon, Message } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import {
  addToken,
  selectToken,
  unselectToken,
  deleteToken,
} from '../../../../store/token/token.actions';
import { TokenAddModal } from './token-add.view.jsx';
import * as Constant from '../../../../constants';
import tokensLoad from '../../../../store/token/token.thunks';

function WalletInfo({
  login,
  token,
  message,
  onAddToken,
  onSelectToken,
  onUnselectToken,
  onDeleteToken,
  onLoadTokens,
}) {
  const [modalTokenAddEnable, setModalTokenAddEnable] = React.useState(false);
  const [removeTokenEnable, setRemoveTokenEnable] = React.useState(false);

  if (typeof login.nf3 === 'undefined') {
    return null;
  }

  const importedWallet = () => {
    if (login.nf3.ethereumAddress === '' || typeof login.nf3.ethereumAddress === 'undefined') {
      return (
        <div>
          <Icon name="close" color="red" />
          You must import a wallet!
        </div>
      );
    }
    return login.nf3.ethereumAddress;
  };

  // TODO : substitute reload button by periodic function
  const reload = () => {
    onLoadTokens([]);
  };

  const toggleTokenSelected = () => {
    setRemoveTokenEnable(!removeTokenEnable);
  };

  function setActiveRow(id) {
    reload();
    if (id !== token.activeTokenRowId) {
      onSelectToken(id);
      if (removeTokenEnable) {
        onDeleteToken(login.nf3.zkpKeys.compressedPkd, id);
        toggleTokenSelected();
      }
    } else {
      onUnselectToken();
    }
  }

  function renderRowTable() {
    const rows = token.tokenPool.map(item => {
      const tokenTypeId = `token type${item.tokenAddress}`;
      const l1BalanceId = `l1 balance${item.tokenAddress}`;
      const l2BalanceId = `l2 balance${item.tokenAddress}`;
      const pendingDepositId = `pending deposit${item.tokenAddress}`;
      const pendingTransferredOutId = `pending transferred out${item.tokenAddress}`;
      return (
        <Table.Row
          key={item.tokenAddress}
          active={item.tokenAddress === token.activeTokenRowId}
          onClick={() => {
            setActiveRow(item.tokenAddress);
          }}
        >
          <Table.Cell colSpan="4" title={item.tokenAddress} id="address">
            {item.tokenAddress}
          </Table.Cell>
          <Table.Cell colSpan="1" title={item.tokenType} id={tokenTypeId}>
            {item.tokenType}
          </Table.Cell>
          <Table.Cell colSpan="1" title={item.tokenBalanceL1} id={l1BalanceId}>
            {item.tokenBalanceL1}
          </Table.Cell>
          <Table.Cell colSpan="1" title={item.tokenBalanceL2} id={l2BalanceId}>
            {item.tokenBalanceL2}
          </Table.Cell>
          <Table.Cell colSpan="1" title={item.tokenBalanceL2} id={pendingDepositId}>
            {item.tokenPendingDepositL2}
          </Table.Cell>
          <Table.Cell colSpan="1" title={item.tokenBalanceL2} id={pendingTransferredOutId}>
            {item.tokenPendingSpentL2}
          </Table.Cell>
        </Table.Row>
      );
    });
    return rows;
  }

  React.useEffect(() => {
    const retrieveBalance = setInterval(() => {
      reload();
    }, Constant.BALANCE_INTERVAL);
    return () => clearInterval(retrieveBalance);
  }, []);

  const handleOnTokenAddSubmit = (tokenName, tokenType, tokenAddress, tokenBalance) => {
    onAddToken(
      login.nf3.zkpKeys.compressedPkd,
      tokenAddress.toLowerCase(),
      tokenType,
      '0x0',
      '0x0',
      tokenName,
      tokenBalance,
      '-',
      '-',
      '-',
    );
  };

  const toggleModalTokenAdd = () => {
    setModalTokenAddEnable(!modalTokenAddEnable);
  };

  const removeToken = () => {
    onUnselectToken();
    toggleTokenSelected();
  };

  return (
    <Container>
      <Table padded fixed selectable>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Account Address:</Table.HeaderCell>
            <Table.HeaderCell colSpan="4" id="wallet-info-cell-ethaddress">
              {' '}
              {importedWallet()}{' '}
            </Table.HeaderCell>
            <Table.HeaderCell colSpan="4">
              <Button
                icon
                labelPosition="left"
                onClick={toggleModalTokenAdd}
                primary
                floated="right"
                id="wallet-info-cell-add-token"
              >
                <Icon name="plus" />
                Add Token
              </Button>
              <Button
                icon
                labelPosition="left"
                id="wallet-info-cell-remove-token"
                toggle
                onClick={removeToken}
                primary
                floated="right"
                active={removeTokenEnable && token.tokenPool.length}
                disabled={token.tokenPool.length === 0}
              >
                <Icon name="minus" /> Remove Token
              </Button>
            </Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell colSpan="4" textAlign="left">
              Token Address
            </Table.HeaderCell>
            <Table.HeaderCell colSpan="1" textAlign="left">
              Token Type
            </Table.HeaderCell>
            <Table.HeaderCell colSpan="1" textAlign="left">
              L1 Balance
            </Table.HeaderCell>
            <Table.HeaderCell colSpan="1" textAlign="left">
              L2 Balance
            </Table.HeaderCell>
            <Table.HeaderCell colSpan="1" textAlign="left">
              Pending Deposit
            </Table.HeaderCell>
            <Table.HeaderCell colSpan="1" textAlign="left">
              Pending Outflow
            </Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body> {renderRowTable()} </Table.Body>
      </Table>
      <br />
      <TokenAddModal
        modalTokenAdd={modalTokenAddEnable}
        toggleModalTokenAdd={toggleModalTokenAdd}
        handleOnTokenAddSubmit={handleOnTokenAddSubmit}
        nf3={login.nf3}
        token={token}
      />
      {message.nf3Msg !== '' ? (
        <Message info={message.nf3MsgType === 'info'} error={message.nf3MsgType === 'error'}>
          <Message.Header>{message.nf3Msg}</Message.Header>
        </Message>
      ) : null}
    </Container>
  );
}

WalletInfo.propTypes = {
  login: PropTypes.object.isRequired,
  token: PropTypes.object.isRequired,
  message: PropTypes.object.isRequired,
  onAddToken: PropTypes.func.isRequired,
  onSelectToken: PropTypes.func.isRequired,
  onUnselectToken: PropTypes.func.isRequired,
  onDeleteToken: PropTypes.func.isRequired,
  onLoadTokens: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  token: state.token,
  login: state.login,
  message: state.message,
});

const mapDispatchToProps = dispatch => ({
  onSelectToken: tokenRowId => dispatch(selectToken(tokenRowId)),
  onUnselectToken: () => dispatch(unselectToken()),
  onAddToken: (
    compressedPkd,
    tokenAddress,
    tokenType,
    tokenId,
    l2TokenId,
    tokenName,
    l1Balance,
    l2Balance,
    l2PendingDeposit,
    l2PendingSpent,
  ) =>
    dispatch(
      addToken(
        compressedPkd,
        tokenAddress,
        tokenType,
        tokenId,
        l2TokenId,
        tokenName,
        l1Balance,
        l2Balance,
        l2PendingDeposit,
        l2PendingSpent,
      ),
    ),
  onDeleteToken: (compressedPkd, tokenRowId) => dispatch(deleteToken(compressedPkd, tokenRowId)),
  onLoadTokens: initTokens => dispatch(tokensLoad(initTokens)),
});

export default connect(mapStateToProps, mapDispatchToProps)(WalletInfo);