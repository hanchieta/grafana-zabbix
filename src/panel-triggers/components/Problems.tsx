import React, { PureComponent } from 'react';
import ReactTable from 'react-table';
import EventTag from './EventTag';
import { ProblemsPanelOptions, Trigger, ZBXItem, ZBXAcknowledge } from '../types';

export interface ProblemListProps {
  problems: Trigger[];
  panelOptions: ProblemsPanelOptions;
  loading?: boolean;
}

export class ProblemList extends PureComponent<ProblemListProps, any> {
  buildColumns() {
    const result = [];
    const options = this.props.panelOptions;
    const problems = this.props.problems;
    const timeColWidth = problems && problems.length ? problems[0].lastchange.length * 9 : 160;
    const columns = [
      { Header: 'Host', accessor: 'host', show: options.hostField },
      { Header: 'Host (Technical Name)', accessor: 'hostTechName', show: options.hostTechNameField },
      { Header: 'Host Groups', accessor: 'groups', show: options.hostGroups, Cell: GroupCell },
      { Header: 'Proxy', accessor: 'proxy', show: options.hostProxy },
      { Header: 'Severity', accessor: 'severity', show: options.severityField, className: 'problem-severity', width: 120, Cell: SeverityCell },
      { Header: 'Status', accessor: 'value', show: options.statusField, width: 100, Cell: props => StatusCell(props) },
      { Header: 'Problem', accessor: 'description', minWidth: 200, Cell: ProblemCell},
      { Header: 'Tags', accessor: 'tags', show: options.showTags, className: 'problem-tags', Cell: TagCell },
      { Header: 'Time', accessor: 'lastchange', className: 'last-change', width: timeColWidth },
      { Header: 'Details', className: 'custom-expander', width: 60, expander: true, Expander: CustomExpander },
    ];
    for (const column of columns) {
      if (column.show || column.show === undefined) {
        delete column.show;
        result.push(column);
      }
    }
    return result;
  }

  render() {
    console.log(this.props.problems, this.props.panelOptions);
    const columns = this.buildColumns();
    // const data = this.props.problems.map(p => [p.host, p.description]);
    return (
      <div className="panel-problems">
        <ReactTable
          data={this.props.problems}
          columns={columns}
          defaultPageSize={10}
          loading={this.props.loading}
          SubComponent={props => <ProblemDetails {...props} />}
        />
      </div>
    );
  }
}

// interface CellProps {
//   row: any;
//   original: any;
// }

function SeverityCell(props) {
  // console.log(props);
  return (
    <div className='severity-cell' style={{ background: props.original.color }}>
      {props.value}
    </div>
  );
}

const DEFAULT_OK_COLOR = 'rgb(56, 189, 113)';
const DEFAULT_PROBLEM_COLOR = 'rgb(215, 0, 0)';

function StatusCell(props, okColor = DEFAULT_OK_COLOR, problemColor = DEFAULT_PROBLEM_COLOR) {
  // console.log(props);
  const status = props.value === '0' ? 'OK' : 'PROBLEM';
  const color = props.value === '0' ? okColor : problemColor;
  return (
    <span style={{ color }}>{status}</span>
  );
}

function GroupCell(props) {
  let groups = "";
  if (props.value && props.value.length) {
    groups = props.value.map(g => g.name).join(', ');
  }
  return (
    <span>{groups}</span>
  );
}

function ProblemCell(props) {
  const comments = props.original.comments;
  return (
    <div>
      <span>{props.value}</span>
      {comments && <FAIcon icon="file-text-o" customClass="comments-icon" />}
    </div>
  );
}

function TagCell(props) {
  const tags = props.value || [];
  return [
    tags.map(tag => <EventTag key={tag.tag + tag.value} tag={tag} />)
  ];
}

function CustomExpander(props) {
  return (
    <span className={props.isExpanded ? "expanded" : ""}>
      <i className="fa fa-info-circle"></i>
    </span>
  );
}

interface FAIconProps {
  icon: string;
  customClass?: string;
}

function FAIcon(props: FAIconProps) {
  return (
    <span className={`fa-icon-container ${props.customClass || ''}`}>
      <i className={`fa fa-${props.icon}`}></i>
    </span>
  );
}

interface ProblemItemProps {
  item: ZBXItem;
  showName?: boolean;
}

function ProblemItem(props: ProblemItemProps) {
  const { item, showName } = props;
  return (
    <div className="problem-item">
      <FAIcon icon="thermometer-three-quarters" />
      {showName && <span className="problem-item-name">{item.name}: </span>}
      <span className="problem-item-value">{item.lastvalue}</span>
    </div>
  );
}

interface ProblemItemsProps {
  items: ZBXItem[];
}

class ProblemItems extends PureComponent<ProblemItemsProps> {
  render() {
    const { items } = this.props;
    return (items.length > 1 ?
      items.map(item => <ProblemItem item={item} key={item.itemid} showName={true} />) :
      <ProblemItem item={items[0]} />
    );
  }
}

interface EventAckProps {
  acknowledge: ZBXAcknowledge;
}

function EventAck(props: EventAckProps) {
  const ack = props.acknowledge;
  return (
    <div className="problem-ack">
      <span className="problem-ack-time">{ack.time}</span>
      <span className="problem-ack-user">{ack.user}</span>
      <span className="problem-ack-message">{ack.message}</span>
    </div>
  );
}

class ProblemDetails extends PureComponent<any, any> {
  constructor(props) {
    super(props);
    this.state = {
      show: false
    };
  }

  componentDidMount() {
    requestAnimationFrame(() => {
      this.setState({ show: true });
    });
  }

  render() {
    const problem = this.props.original as Trigger;
    const displayClass = this.state.show ? 'show' : '';
    let groups = "";
    if (problem && problem.groups) {
      groups = problem.groups.map(g => g.name).join(', ');
    }
    return (
      <div className={`problem-details-container ${displayClass}`}>
        <div className="problem-details">
          <h6>Problem Details</h6>
          <div className="problem-age">
            <FAIcon icon="clock-o" />
            <span>{problem.age}</span>
          </div>
          {problem.items && <ProblemItems items={problem.items} />}
          {problem.comments &&
            <div className="problem-description">
              <span className="description-label">Description:&nbsp;</span>
              <span>{problem.comments}</span>
            </div>
          }
          {problem.type === '1' && <FAIcon icon="bullhorn" customClass="problem-multi-event-type" />}
          <div className="problem-tags">
            {problem.tags && problem.tags.map(tag => <EventTag key={tag.tag + tag.value} tag={tag} />)}
          </div>
        </div>
        {problem.acknowledges &&
          <div className="problem-details-middle">
            <h6><FAIcon icon="reply-all" /> Acknowledges</h6>
            <div className="problem-ack-list">
              {problem.acknowledges.map(ack => <EventAck key={ack.acknowledgeid} acknowledge={ack} />)}
            </div>
          </div>
        }
        <div className="problem-details-right">
          <div>
            <FAIcon icon="database" />
            <span>{problem.datasource}</span>
          </div>
          {problem.proxy &&
            <div>
              <FAIcon icon="cloud" />
              <span>{problem.proxy}</span>
            </div>
          }
          <div>
            <FAIcon icon="folder" />
            <span>{groups}</span>
          </div>
          {problem.maintenance &&
            <div className="problem-maintenance">
              <FAIcon icon="wrench" />
            </div>
          }
        </div>
      </div>
    );
  }
}
